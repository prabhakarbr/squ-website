(function (Drupal, once) {

  'use strict';

  Drupal.behaviors.squAccordion = {

    attach: function (context) {

      once(
        'squAccordion',
        '.squ-accordion__button',
        context
      ).forEach(function (button) {

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

        /*
         * Keep the first accordion item open by default.
         */
        var accordion = item.closest('.squ-accordion');

        if (accordion) {
          var firstItem = accordion.querySelector(
            '.squ-accordion__item'
          );

          if (firstItem === item) {
            item.classList.add('is-open');
            button.setAttribute('aria-expanded', 'true');
            content.hidden = false;

            if (icon) {
              icon.textContent = '−';
            }
          } else {
            item.classList.remove('is-open');
            button.setAttribute('aria-expanded', 'false');
            content.hidden = true;

            if (icon) {
              icon.textContent = '+';
            }
          }
        }

        button.addEventListener('click', function () {

          var isOpen = item.classList.contains('is-open');

          /* CLOSE current item */
          if (isOpen) {
            item.classList.remove('is-open');

            button.setAttribute('aria-expanded', 'false');
            content.hidden = true;

            if (icon) {
              icon.textContent = '+';
            }

            return;
          }

          /* CLOSE other open items */
          if (accordion) {
            accordion.querySelectorAll(
              '.squ-accordion__item.is-open'
            ).forEach(function (otherItem) {

              if (otherItem === item) {
                return;
              }

              otherItem.classList.remove('is-open');

              var otherButton = otherItem.querySelector(
                '.squ-accordion__button'
              );

              var otherContent = otherItem.querySelector(
                ':scope > .squ-accordion__content'
              );

              var otherIcon = otherItem.querySelector(
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

          /* OPEN current item */
          item.classList.add('is-open');

          button.setAttribute('aria-expanded', 'true');
          content.hidden = false;

          if (icon) {
            icon.textContent = '−';
          }

        });

      });

    }

  };

})(Drupal, once);
