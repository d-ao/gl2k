# -*- coding: utf-'8' "-*-"
from openerp import http, fields
from openerp.http import request
from openerp.addons.fso_forms.controllers.controller import FsoForms

import json

import logging
_logger = logging.getLogger(__name__)


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


class FsoFormsGL2KGardenVis(FsoForms):

    def validate_fields(self, form, field_data):
        field_errors = super(FsoFormsGL2KGardenVis, self).validate_fields(form, field_data)

        # Check if a record exits already (must also work with the back button of the form)
        # ATTENTION: Only check this if form_session_data is already cleared else we do come from the "Change Data"
        #            Button on the Thank you Page!
        # HINT: "form_sdata['clear_session_data'] is False" means we come from the thank you page with edit data button
        #       clicked
        form_sdata = self.get_fso_form_session_data(form.id, check_clear_session_data=False)
        if not form_sdata or not (form_sdata['clear_session_data'] is False):
            if form and form.model_id and form.model_id.name == 'gl2k.garden':
                email = field_data.get('email', False)
                if email:
                    if request.env['gl2k.garden'].sudo().search([('email', '=', email)], limit=1):
                        field_errors['email'] = "Sie haben mit Ihrer Email Adresse bereits teilgenommen!"
        if field_errors:
            _logger.warning("field_errors found: %s" % str(field_errors))
        return field_errors
