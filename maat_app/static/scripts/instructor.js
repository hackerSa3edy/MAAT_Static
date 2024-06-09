$(document).ready(function () {
  // Get the current date in ISO format
  const today = new Date();
  const formattedToday = today.toISOString().slice(0, 16);

  // Select the date input element and set the minimum date
  $('#start-date').attr('min', formattedToday);
  $('#end-date').attr('min', formattedToday);

  // add question

  // Add click event listener to the submit button
  $('#submit').on('click', function (event) {
    event.preventDefault();
    $('.mainPage').css('opacity', '0.5');
    $('.addQuestions').css('visibility', 'visible');
  });

  // Add click event listener to the close icon in the question form
  $('.questionForm i').click(function () {
    $('.questionForm i').parent().parent().css('visibility', 'hidden');
    $('.mainPage').css('opacity', '1');
  });
});
