(function ($, Drupal, once) {
  Drupal.behaviors.achievementSlider = {
    attach: function (context) {
      $(once('achievement-slider', '.achievement-slider__items .field__items', context)).each(function () {
        var $slider = $(this);

        if ($slider.hasClass('slick-initialized')) {
          return;
        }

        $slider.slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          autoplay: true,
          autoplaySpeed: 4000,
          arrows: true,
          dots: true,
          infinite: true,
          adaptiveHeight: true
        });
      });
    }
  };
})(jQuery, Drupal, once);