$(document).ready(function () {
  $('form').on('submit', function (event) {
    // Prevent the form from submitting the traditional way
    event.preventDefault();
    $('#flash-message').text('Incorrect username or password.').hide();

    const username = $('#username').val();
    const password = $('#pass').val();
    const rememberMe = $('#remember-me').is(':checked'); // Assuming the id of your checkbox is 'remember-me'

    $.ajax({
      url: 'http://localhost/api/auth/token/',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        username: username,
        password: password
      }),
      success: function (token) {
        if (rememberMe) {
          // Set cookie to expire in 7 days
          const date = new Date();
          date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
          const expires = '; expires=' + date.toUTCString();
          document.cookie = `jwtAccess=${token.access}; path=/; expires=${expires}`;
        } else {
          // Set cookie that expires when browser is closed
          document.cookie = `jwtAccess=${token.access}; path=/`;
        }
        window.location.href = '/profile';
      },
      error: function (jqXHR, textStatus, errorThrown) {
        $('#flash-message').text(jqXHR?.responseJSON?.detail || errorThrown || textStatus).show();
      }
    });
  });
});
