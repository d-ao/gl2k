(function () {
    'use strict';

    openerp.website.EditorBar.include({

        edit: function () {
            // console.log('EDIT');
            $('#gardenMapInfoBox').remove();
            $('#gardenMapGallery').remove();
            return this._super.apply(this, arguments);
        },

        save: function () {
            // console.log('SAVE');
            this._super();
        },
    });

})();
