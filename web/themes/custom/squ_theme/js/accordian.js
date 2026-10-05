(function (Drupal, once) {

  'use strict';

  Drupal.behaviors.squAccordion = {

    attach: function (context) {

      once(
        'squAccordion',
        '.squ-accordion__button',
        context
      ).forEach(function (button) {

        button.addEventListener('click', function () {

          var item = button.closest('.squ-accordion__item');

          if (!item) {
            return;
          }

          var content = item.querySelector(
            ':scope > .squ-accordion__content'
          );

          var icon = button.querySelector(
            '.squ-accordion__icon'
          );

          if (!content) {
            return;
          }

          var isOpen = item.classList.contains('is-open');


          /* CLOSE */
          if (isOpen) {

            item.classList.remove('is-open');

            button.setAttribute(
              'aria-expanded',
              'false'
            );

            content.hidden = true;

            if (icon) {
              icon.textContent = '+';
            }

            return;
          }


          /* CLOSE OTHER OPEN ITEMS */

          var accordion = item.closest('.squ-accordion');

          if (accordion) {

            var openItems = accordion.querySelectorAll(
              '.squ-accordion__item.is-open'
            );

            openItems.forEach(function (otherItem) {

              if (otherItem === item) {
                return;
              }

              otherItem.classList.remove('is-open');

              var otherButton =
                otherItem.querySelector(
                  '.squ-accordion__button'
                );

              var otherContent =
                otherItem.querySelector(
                  ':scope > .squ-accordion__content'
                );

              var otherIcon =
                otherItem.querySelector(
                  '.squ-accordion__icon'
                );

              if (otherButton) {
                otherButton.setAttribute(
                  'aria-expanded',
                  'false'
                );
              }

              if (otherContent) {
                otherContent.hidden = true;
              }

              if (otherIcon) {
                otherIcon.textContent = '+';
              }

            });

          }


          /* OPEN CURRENT ITEM */

          item.classList.add('is-open');

          button.setAttribute(
            'aria-expanded',
            'true'
          );

          content.hidden = false;

          if (icon) {
            icon.textContent = '−';
          }

        });

      });

    }

  };

})(Drupal, once);
