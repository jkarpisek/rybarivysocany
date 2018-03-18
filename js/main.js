(function ($) {
    "use strict"; // Start of use strict
    var $mainNav = $("#mainNav");
    var $navbarCollapseButton = $('.navbar-collapse');
    var navbarOffset = 50;

    $navbarCollapseButton.on('show.bs.collapse', function () {
        $mainNav.addClass("navbar-shrink");
    }).on('hidden.bs.collapse', function () {
        if ($mainNav.offset().top < navbarOffset) {
            $mainNav.removeClass("navbar-shrink");
        }
    });

    // Collapse Navbar
    var navbarCollapse = function () {
        if (!$navbarCollapseButton.hasClass('show')) {
            if ($mainNav.offset().top > navbarOffset) {
                $mainNav.addClass("navbar-shrink");
            } else {
                $mainNav.removeClass("navbar-shrink");
            }
        }
    };
    // Collapse now if page is not at top
    navbarCollapse();
    // Collapse the navbar when page is scrolled
    $(window).scroll(navbarCollapse);

})(jQuery); // End of use strict
