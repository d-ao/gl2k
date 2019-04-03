(function () {
    'use strict';

    openerp.website.EditorBar.include({

        start: function () {
            // console.log('START');
            return this._super();
        },

        edit: function () {
            // console.log('EDIT');
            return this._super.apply(this, arguments);
        },

        save: function () {
            // console.log('SAVE');
            this._super();
        },
    });

})();
