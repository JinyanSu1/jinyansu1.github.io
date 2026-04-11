document.addEventListener('DOMContentLoaded', function () {
  var titles = document.querySelectorAll('.pub-title[role="button"]');

  titles.forEach(function (title) {
    title.addEventListener('click', function () {
      var card = this.closest('.pub-card');
      var details = card.querySelector('.pub-details');
      var isExpanded = this.getAttribute('aria-expanded') === 'true';

      this.setAttribute('aria-expanded', !isExpanded);
      details.setAttribute('aria-hidden', isExpanded);
    });

    title.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
});
