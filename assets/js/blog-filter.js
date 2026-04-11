document.addEventListener('DOMContentLoaded', function () {
  var pills = document.querySelectorAll('.filter-pill');
  var cards = document.querySelectorAll('.blog-post-card');

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      var category = this.getAttribute('data-category');

      pills.forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');

      cards.forEach(function (card) {
        if (category === 'all' || card.getAttribute('data-category') === category) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
});
