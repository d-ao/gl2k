# -*- coding: utf-'8' "-*-"
from openerp import api, models, fields

__author__ = 'Michael Karrer'


# Product Template
class ProductTemplate(models.Model):
    _inherit = 'product.template'

    website_theme = fields.Selection(selection_add=[('gl2k_inline', 'Global 2000 Inline'),
                                                    ('gl2k_inline_test', 'Global 2000 Inline Testtheme'),
                                                    ('gl2k_theme_a', 'Global 2000 Theme A'),
                                                    ('gl2k_theme_b', 'Global 2000 Theme B'),
                                                    ('gl2k_theme_c', 'Global 2000 Theme C')])
