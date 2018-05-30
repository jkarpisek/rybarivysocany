var Gallery = function() {
    var jModal;
    var jCurrentImage;
    var galleryGroup;
    var images;

    function init() {
        jModal = $('#gallery-modal');
        jModal.find('#gallery-close').click(close);
        jModal.find('#gallery-left').click(moveImageToLeft);
        jModal.find('#gallery-right').click(moveImageToRight);
        $('body').keydown(keydownEvent);

        $('div.gallery-group-show-hide-button').find('button').click(showHideGalleryGroup);
        $('div.gallery-group').each(initGalleryGroup);

        $('img.gallery-image').click(function() {
            clickOnImage($(this));
        });
    }

    function showHideGalleryGroup() {
        var jThis = $(this);
        jThis.closest('.gallery-group').find('div.row:not(.gallery-group-show-hide-button)').toggleClass('hidden').find('img.gallery-image').each(function() {
            $(this).prop('src', $(this).data('src'));
        });
        jThis.find('span').toggleClass('hidden');
    }

    function initGalleryGroup() {
        var jThis = $(this);
        jThis.find('div.row').addClass('hidden');
        $('div.gallery-group-show-hide-button.hidden:last').clone(true).removeClass('hidden').appendTo(jThis);
        jThis.removeClass('hidden');

    }

    function clickOnImage(jImage) {
        jCurrentImage = jImage;
        var galleryGroupLocal = jCurrentImage.closest('.gallery-group');
        if (galleryGroupLocal.length) {
            galleryGroup = galleryGroupLocal;
            images = galleryGroup.find('img.gallery-image');
        } else {
            images = jCurrentImage;
        }
        loadImageIntoContent(jCurrentImage);
        jModal.show();
    }

    function keydownEvent(event) {
        if (jModal.is(":visible") ) {
            if(event.keyCode == 37) {
                moveImageToLeft();
                event.preventDefault();
            } else if(event.keyCode == 39) {
                moveImageToRight();
                event.preventDefault();
            } else if(event.keyCode == 27) {
                close();
                event.preventDefault();
            }
        }
    }

    function loadImageIntoContent(jImage) {
        var src = jImage.prop('src').replace('.preview.', '.');
        jModal.find('#gallery-content').prop('src', src);
        if (getPreviousImageIndex(jImage) !== -1) {
            jModal.find('#gallery-left').show();
        } else {
            jModal.find('#gallery-left').hide();
        }
        if (getNextImageIndex(jImage) !== -1) {
            jModal.find('#gallery-right').show();
        } else {
            jModal.find('#gallery-right').hide();
        }
    }

    function getPreviousImageIndex(jImage) {
        var index = images.index(jImage);
        return index > 0 ? index - 1 : -1;
    }

    function getNextImageIndex(jImage) {
        var index = images.index(jImage);
        return index < images.length - 1 ? index + 1 : -1;
    }

    function getImageByIndex(index) {
        return $(images.get(index));
    }

    function moveImageToLeft() {
        var index = getPreviousImageIndex(jCurrentImage);
        if (index !== -1) {
            jCurrentImage = getImageByIndex(index);
            loadImageIntoContent(jCurrentImage);
        }
    }

    function moveImageToRight() {
        var index = getNextImageIndex(jCurrentImage);
        if (index !== -1) {
            jCurrentImage = getImageByIndex(index);
            loadImageIntoContent(jCurrentImage);
        }
    }

    function close() {
        jModal.hide();
    }

    return { init: init };
};

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

    new Gallery().init();

})(jQuery); // End of use strict
