# -*- coding: utf-'8' "-*-"

from openerp import models, fields, api, tools, registry
from openerp.tools.translate import _

import logging
logger = logging.getLogger(__name__)


class GL2KGarden(models.Model):
    _name = "gl2k.garden"

    # Filed to watch for geo localization
    _geo_location_fields = ('zip', 'country_id', 'city')

    # ------
    # FIELDS
    # ------
    def _default_country(self):
        austria = self.env['res.country'].search([('code', '=', 'AT')], limit=1)
        return austria or False

    state = fields.Selection(string="State", selection=[('new', 'New'),
                                                        ('approved', 'Approved'),
                                                        ('rejected', 'Rejected'),
                                                        ('invalid', 'Invalid'),
                                                        ('disabled', 'Disabled')],
                             default="new")

    # Form input fields
    # -----------------
    email = fields.Char(string="E-Mail", required=True)
    newsletter = fields.Boolean(string="Newsletter", help="Subscribe for the Newsletter")

    title = fields.Char(string="Title")
    firstname = fields.Char(string="Firstname")
    lastname = fields.Char(string="Lastname")

    # res.partner address
    zip = fields.Char(string="Zip", required=True)
    street = fields.Char(string="Street")
    city = fields.Char(string="City")
    country_id = fields.Many2one(string="Country", comodel_name="res.country", required=True,
                                 default=_default_country, domain="[('code', '=', 'AT')]")

    # garden fields
    garden_size = fields.Integer(string="Garden Size m2", required=True)
    garden_image_name = fields.Char(string="Garden Image Name")
    garden_image_file = fields.Binary(string="Garden Image File")

    # Computed and system fields (non user land)
    # ------------------------------------------
    login_token_used = fields.Char("Login Token", readonly=True)
    # TODO: login_token_id = fields.Many2one() and other token info like CDS, Action or Origin

    # Will be computed based on zip field by the help of the addon base_location
    cmp_partner_id = fields.Many2one(string="Computed Partner", comodel_name="res.partner", readonly=True)
    cmp_state_id = fields.Many2one(string="Computed State", comodel_name="res.country.state", readonly=True)
    cmp_county_province = fields.Char(string="Computed Province", readonly=True)
    cmp_county_province_code = fields.Char(string="Computed Province Code", readonly=True)
    cmp_city = fields.Char(string="Computed City", readonly=True)


    # E-Mail validation / Double-Opt-In
    # HINT: Will change on every email change!
    email_validated = fields.Char(string="E-Mail Validated", readonly=True)
    email_validated_token = fields.Char(string="E-Mail Validated Token", readonly=True,
                                        help="For Double-Opt-In Link")
    email_validated_time = fields.Datetime(string="E-Mail Validated At", readonly=True,
                                           help="E-Mail-Validate-Link validated at datetime")

    # ONCHANGE
    # --------
    # Update fields based on zip field
    # HINT: This will not be stored by the gui since all fields are read only therefore it is added to create and write
    #       Still this is is left here because it is very convenient to see the cmp field values directly
    @api.onchange(*_geo_location_fields)
    def onchange_zip(self):
        for r in self:
            cmp_fields_vals = self.get_cmp_fields_vals(zip=r.zip, country_id=r.country_id.id, city=r.city)

            for v in cmp_fields_vals:
                r[v] = cmp_fields_vals[v]

    # -------------
    # MODEL METHODS
    # -------------
    @api.model
    def get_cmp_fields_vals(self, zip='', country_id='', city=''):
        # TODO: search for the partner id either by token or by data matching

        better_zip = False
        if zip and country_id and city:
            better_zip = self.env['res.better.zip'].search([('name', '=', zip),
                                                            ('country_id', '=', country_id),
                                                            ('city', '=', city)
                                                            ], limit=1)
            if not better_zip:
                better_zip = self.env['res.better.zip'].search([('name', '=', zip),
                                                                ('country_id', '=', country_id),
                                                                ('city', 'ilike', city)
                                                                ], limit=1)
        if not better_zip and zip and country_id:
            better_zip = self.env['res.better.zip'].search([('name', '=', zip),
                                                            ('country_id', '=', country_id),
                                                            ], limit=1)

        return {
            'cmp_state_id': better_zip.state_id.id if better_zip and better_zip.state_id else False,
            'cmp_city': better_zip.city if better_zip else False,
            'cmp_county_province': better_zip.county_province if better_zip else False,
            'cmp_county_province_code': better_zip.county_province_code if better_zip else False,
        }

    # ----
    # CRUD
    # ----
    @api.model
    def create(self, vals):

        country_id = vals.get('country_id', False)
        # Check for default country
        if country_id and self._default_country() and country_id != self._default_country().id:
            logger.error("Country must be Austria!")
            vals['state'] = 'invalid'

        # Append computed fields values
        if vals.get('zip', False) and vals.get('country_id', False):
            vals.update(self.get_cmp_fields_vals(zip=vals.get('zip'),
                                                 country_id=vals.get('country_id'),
                                                 city=vals.get('city', '')))

        return super(GL2KGarden, self).create(vals)

    @api.multi
    def write(self, vals):
        # Update self first
        # HINT: res is just a boolean
        res = super(GL2KGarden, self).write(vals)

        # Update computed fields
        if res and any(f in vals for f in self._geo_location_fields):
            for r in self:
                cmp_vals = {}
                # Check for default country
                if r.country_id and self._default_country() and r.country_id.id != self._default_country().id:
                    logger.error("Country must be Austria (ID %s)" % r.id)
                    cmp_vals['state'] = 'invalid'
                # Get computed field values
                cmp_vals.update(r.get_cmp_fields_vals(zip=r.zip, country_id=r.country_id.id, city=r.city))
                # Update record
                r.write(cmp_vals)

        return res
