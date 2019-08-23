# -*- coding: utf-'8' "-*-"
from openerp import http, fields
from openerp.http import request
from openerp.addons.fso_forms.controllers.controller import FsoForms

import functools
import csv
import werkzeug.wrappers
import zipfile
import tempfile

import logging
_logger = logging.getLogger(__name__)


# Nested Attribute getter:
# https://stackoverflow.com/questions/31174295/getattr-and-setattr-on-nested-objects
def rgetattr(obj, attr, *args):
    def _getattr(obj, attr):
        return getattr(obj, attr, *args)
    return functools.reduce(_getattr, [obj] + attr.split('.'))


class GL2KGardenVis(http.Controller):

    @http.route('/gl2k/garden/data', type='json', auth="public")
    def gl2k_garden_data(self, **post):
        # https://stackoverflow.com/questions/24006291/postgresql-return-result-set-as-json-array
        # https://dba.stackexchange.com/questions/69655/select-columns-inside-json-agg
        cr = http.request.env.cr

        # HACK TO BE ALWAYS ON LATEST DATA
        # _logger.info("Hack for latest data - remove after test or inital phase")
        # http.request.env['gl2k.garden'].refresh_materialized_views()

        # Get the state data (Bundeslaender)
        cr.execute("SELECT json_agg(garden_rep_state) FROM garden_rep_state;")
        garden_rep_state = cr.fetchone()

        # Get the community data (Gemeinden)
        cr.execute("SELECT json_agg(garden_rep_community) FROM garden_rep_community;")
        garden_rep_community = cr.fetchone()

        # HINT: For http.Controller of type 'json' the return object will be automatically converted to a json string
        data = {
            'state_data': garden_rep_state,
            'community_data': garden_rep_community,
        }
        return data

    # Return image urls
    @http.route('/gl2k/garden/image', type='json', auth="public")
    def gl2k_garden_image(self, thumbnail_record_ids=False,  **post):
        # TODO: use special placeholder-image (check 'def placeholder()' in 'website/controllers/main.py')
        # HINT: Check website/controllers/main.py for route '/website/image'
        thumbnail_urls = {}
        image_urls = {}

        # Thumbnails URLS
        if thumbnail_record_ids:
            garden_obj = http.request.env['gl2k.garden']
            thumbnail_records = garden_obj.search([('id', 'in', thumbnail_record_ids),
                                                   ('cmp_thumbnail_file', '!=', False)])
            thumbnail_urls = {r.id: '/website/image/gl2k.garden/'+str(r.id)+'/cmp_thumbnail_file'
                              for r in thumbnail_records}
            image_urls = {r.id: '/website/image/gl2k.garden/'+str(r.id)+'/cmp_image_file'
                          for r in thumbnail_records}

        return {'thumbnail_urls': thumbnail_urls, 'image_urls': image_urls}

    @http.route('/gl2k/garden/danke', website=True, auth='public')
    def gl2k_garden_danke(self, **kwargs):
        return http.request.render('gl2k_gardenvis.danke')

    @http.route('/gl2k/garden/export', website=True, auth='public')
    def gl2k_garden_export(self, **kwargs):
        """Return a zip file with a CSV-File for the garden entries and all thumbnail images of the garden """
        garden_obj = http.request.env['gl2k.garden']
        all_garden_records = garden_obj.search([])

        # New werkzeug response object
        response = werkzeug.wrappers.Response()
        response.charset = 'utf-8'
        response.content_type = "text/csv"
        response.headers['Content-Disposition'] = 'attachment; filename="garden.csv"'
        # response.mimetype = 'text/csv'

        # Fields to export
        fields = [('id', 'Garteneintrag ID'),
                  ('partner_id.id', 'Partner ID'),
                  ('country_id.name', 'Land'),
                  ]
        header_row = [v[1] for v in fields]

        # Use the CSV writer to stream to the response object
        writer = csv.writer(response.stream)
        writer.writerow(header_row)

        # Record data to csv
        for g in all_garden_records:
            garden_row = list()
            for f in fields:
                try:
                    val = rgetattr(g, f[0])
                    val = '' if not val else val
                    if isinstance(val, unicode):
                        val = val.encode('utf8')
                except:
                    val = ''
                garden_row.append(val)
            writer.writerow(garden_row)

        # TODO: Check if we need to close the writer csv object?

        return response


    # TODO WIP!
    @http.route('/gl2k/garden/zipexport', website=True, auth='public')
    def gl2k_garden_zipexport(self, **kwargs):
        # https://stackabuse.com/the-python-tempfile-module/
        # https://www.datacamp.com/community/tutorials/zip-file#CZF
        # https://docs.python.org/2/library/zipfile.html

        # Creat a new temporary file
        # TODO: Create a temp directory
        # TODO: Save images to temp directory
        # TODO: Save csv.file to temp directory
        # TODO: Use zipfile to create an archive from the tempfile
        temp_file = tempfile.NamedTemporaryFile(suffix=".zip")
        with zipfile.ZipFile(temp_file, 'a') as archive:
            # TODO: archive.write()
            #       the image files and
            #       the csv file to the zip archive
            # TODO: set zip compression
            pass

        # Create an response object
        response = werkzeug.wrappers.Response()
        response.charset = 'utf-8'
        response.content_type = "application/zip"
        response.headers['Content-Disposition'] = 'attachment; filename="garden.zip"'

        # TODO: Check how to insert the temp file to the werkzeug response object

        return response


class FsoFormsGL2KGardenVis(FsoForms):

    def validate_fields(self, form, field_data):
        field_errors = super(FsoFormsGL2KGardenVis, self).validate_fields(form, field_data)

        # Special validations only for 'gl2k.garden' forms
        if form and form.model_id and form.model_id.name == 'gl2k.garden':

            # Allow only one record per e-mail
            email = field_data.get('email', False)
            if email:
                record_to_update = self.get_fso_form_record(form)
                if not record_to_update:
                    if request.env['gl2k.garden'].sudo().search([('email', '=', email)], limit=1):
                        field_errors['email'] = "Sie haben mit Ihrer Email Adresse bereits teilgenommen!"
                else:
                    if request.env['gl2k.garden'].sudo().search(
                            [('email', '=', email), ('id', '!=', record_to_update.id)], limit=1):
                        field_errors['email'] = "Sie haben mit Ihrer Email Adresse bereits teilgenommen!"

        return field_errors

    def get_fso_form_records_by_user(self, form=None, user=None):
        records = super(FsoFormsGL2KGardenVis, self).get_fso_form_records_by_user(form=form, user=user)

        # Return only the approved record (if more than one record was found and there is exactly one approved record)
        if form and form.model_id and form.model_id.name == 'gl2k.garden':
            if records and len(records) > 1:
                approved_records = records.filtered(lambda r: r.state == 'approved')
                if len(approved_records) == 1:
                    return approved_records

        return records

