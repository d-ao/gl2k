
$(document).ready( function() {
	$("body[data-rootcatid='13'] .oe_product").click( function( e ) {
        e.preventDefault();
    });
    //find clicked elemments
    //$("div").click(function(){
    //    alert($(this).attr("class"));
    //});
	// disable quick-add-to-cart-button
	//$("body[data-rootcatid='2'] .quick_add_to_cart .a-submit").unbind('click');
//    if ('parentIFrame' in window) {
//        $(".a-submit").click(function () {
//            partenIframe.scrollToOffset(0, $('.one-page-checkout').offset().top - 25);
//        });
//    }
//    else { // testing only not in Iframe
//        console.log("not in Iframe");
//        $(".a-submit").click(function () {
//                //$.scrollTo($('.one-page-checkout').offset().top - 25);
//                $('html, body').animate({scrollTop: $('.one-page-checkout').offset().top - 100}, 'slow');
//        });
//    }
});