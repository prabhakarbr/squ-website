(function (Drupal, once) {
  Drupal.behaviors.engineeringProgramTabs = {
    attach: function (context) {
      once('engineering-program-tabs', '.engineering-program-tabs', context)
        .forEach(function (wrapper) {
          const buttons = wrapper.querySelectorAll('.engineering-tab-button');
          const panels = wrapper.querySelectorAll('.engineering-tab-panel');

          function activate(button) {
            buttons.forEach(function (item) {
              const active = item === button;
              item.classList.toggle('active', active);
              item.setAttribute('aria-selected', active ? 'true' : 'false');
            });

            panels.forEach(function (panel) {
              panel.classList.toggle(
                'active',
                panel.id === button.dataset.tab
              );
              panel.hidden = panel.id !== button.dataset.tab;
            });
          }

          buttons.forEach(function (button) {
            button.addEventListener('click', function () {
              activate(button);
            });
          });

          if (buttons.length) {
            activate(buttons[0]);
          }
        });
    }
  };
})(Drupal, once);