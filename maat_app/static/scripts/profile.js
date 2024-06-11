$(document).ready(function () {
  const fields = [
    'username', 'email', 'city', 'level', 'first_name', 'second_name', 'third_name', 'fourth_name',
    'gender', 'birth_date', 'address', 'phone_number', 'department', 'specialization'
  ];
  const originalData = {};

  const populateUserProfile = (data) => {
    $('#username').val(data.username);
    $('.profile p').text(data.username);
    $('.mainData h3').text(data.username);
    $('#email').val(data.email);
    $('#city').val(data.city);
    if ('level' in data) {
      $('#h-level').text('Level ' + data.level);
      $('#level').val(data.level);
    } else {
      $('#level').hide();
      $('#h-level').hide();
    }
    $('#first_name').val(data.first_name);
    $('#second_name').val(data.second_name);
    $('#third_name').val(data.third_name);
    $('#fourth_name').val(data.fourth_name);
    $('#gender').val(data.gender);
    $('#birth_date').val(data.birth_date);
    $('#address').val(data.address);
    $('#phone_number').val(data.phone);
    if ('department' in data) {
      $('#department').val(data.department.title);
    } else {
      $('#department').hide();
    }
    if ('specialization' in data) {
      $('#specialization').val(data.courses[0].title);
    } else {
      $('#specialization').hide();
    }
    $('#joined_at').text('Joined at : ' + new Date(data.date_joined).toLocaleDateString());

    // At the top of your script, after the page has loaded
    fields.forEach(field => {
      originalData[field] = $(`#${field}`).val();
      // console.log(originalData[field]);
    });
  };

  const handleAjaxError = (jqXHR, textStatus) => {
    $('#flash-message').text(
      jqXHR?.responseJSON?.detail ||
      jqXHR?.responseJSON?.username ||
      jqXHR?.responseJSON?.email ||
      textStatus);
    $('#flash-message').show();
  };

  const getUserProfile = (userId, token, url) => {
    $.ajax({
      url: url + userId + '/',
      type: 'GET',
      headers: {
        Authorization: 'Bearer ' + token
      },
      success: populateUserProfile,
      error: handleAjaxError
    });
  };

  const getURL = (userRole) => {
    const baseURL = 'https://maat-system.s1cario.tech/api/accounts/';
    let url;
    switch (userRole) {
      case 'admin':
        url = baseURL + 'admins/';
        break;
      case 'instructor':
        url = baseURL + 'instructors/';
        break;
      case 'student':
        url = baseURL + 'students/';
        break;
      default:
        url = baseURL;
    }
    return url;
  };

  const token = document.cookie.replace(/(?:(?:^|.*;\s*)jwtAccess\s*=\s*([^;]*).*$)|^.*$/, '$1');
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  const userId = JSON.parse(jsonPayload).user_id;
  const userRole = JSON.parse(jsonPayload).user_role;
  const url = getURL(userRole);
  getUserProfile(userId, token, url);

  $('#update').click(function () {
    $('input').each(function () {
      $(this).removeAttr('readonly');
    });
    $('select').each(function () {
      $(this).prop('disabled', false);
    });
    $(this).css('background-color', 'white');
  });

  $('#save').click(function () {
    const userData = {};
    // Inside the save button click handler
    fields.forEach(field => {
      const currentValue = $(`#${field}`).val();
      // console.log(`current value: ${currentValue}, original value: ${originalData[field]}`);
      if (currentValue !== originalData[field] && !$(`#${field}`).is(':hidden')) {
        userData[field] = currentValue;
      }
    });

    $.ajax({
      url: url + userId + '/',
      type: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token
      },
      contentType: 'application/json',
      data: JSON.stringify(userData),
      success: (data) => {
        populateUserProfile(data);
        $('input').each(function () {
          $(this).attr('readonly', 'true');
        });
        $('select').each(function () {
          $(this).prop('disabled', true);
        });
        $('#update').css('background-color', '#b3d6f5');
      },
      error: handleAjaxError
    });
  });
});
