$(document).ready(function () {
  const token = document.cookie.replace(/(?:(?:^|.*;\s*)jwtAccess\s*=\s*([^;]*).*$)|^.*$/, '$1');
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  const userId = JSON.parse(jsonPayload).user_id;

  const handleAjaxError = (jqXHR, textStatus) => {
    $('#flash-message').text(
      jqXHR?.responseJSON?.detail ||
      jqXHR?.responseJSON?.username ||
      jqXHR?.responseJSON?.email ||
      textStatus);
    $('#flash-message').show();
  };

  const populateUserProfile = (data) => {
    const courses = data.courses;
    const coursesContainer = $('.courses');

    coursesContainer.empty();
    coursesContainer.append('<h2>Semester Courses</h2>');
    courses.forEach(course => {
      coursesContainer.append(`<div class="course">${course.title}</div>`);
    });
  };

  const getUserProfile = (userId, token) => {
    return $.ajax({
      url: 'http://127.0.0.1/api/accounts/students/' + userId + '/',
      type: 'GET',
      headers: {
        Authorization: 'Bearer ' + token
      },
      success: populateUserProfile,
      error: handleAjaxError
    });
  };

  const populateExams = (data) => {
    const exams = data.results;
    const examsContainer = $('.nonFinishedExams .exams');

    examsContainer.empty();
    exams.forEach(exam => {
      const examDiv = `
        <div class="exam" exam_id="${exam.id}">
          <div class="title">
            <h3>ID: ${exam.id}</h3>
            <h3>${exam.title}</h3>
            <p>${exam.course.title}</p>
          </div>
          <div class="score">
            <div class="row">
              <p>exam score</p>
              <p>${exam.exam_score}</p>
            </div>
          </div>
          <div class="date">
            <p class="start">start : ${new Date(exam.start_date).toLocaleString()}</p>
            <p class="end">end : ${new Date(exam.end_date).toLocaleString()}</p>
          </div>
          <div class="ins">
            Ins / ${exam.instructor.first_name} ${exam.instructor.second_name}
          </div>
          <button type="button" class="start-exam" exam_id="${exam.id}">Start</button>
        </div>`;
      examsContainer.append(examDiv);

      setTimeout(() => {
        // Disable the start button if the current date is less than the start date
        const startDate = new Date(exam.start_date);
        const endDate = new Date(exam.end_date);
        const now = new Date();
        if (now > startDate && now < endDate) {
          $(`button.start-exam[exam_id="${exam.id}"]`).prop('disabled', false);
        } else {
          $(`button.start-exam[exam_id="${exam.id}"]`).prop('disabled', true).text('Exam is over');
        }
      }, 0);

      // Add a click event listener to the start-exam button
      $(`button.start-exam[exam_id="${exam.id}"]`).click(function () {
        // Check if the button is not disabled
        if (!$(this).prop('disabled')) {
          // Navigate to the exam page
          window.location.href = `/exams?exam_id=${exam.id}&exam_title=${exam.title}`;
        }
      });
    });
  };

  const getExams = (token) => {
    $.ajax({
      url: 'http://127.0.0.1/api/exams/',
      type: 'GET',
      headers: {
        Authorization: 'Bearer ' + token
      },
      success: populateExams,
      error: handleAjaxError
    });
  };

  const populateFinishedExams = (data) => {
    const results = data.results;
    const examsContainer = $('.finishedExams .exams');

    examsContainer.empty();
    results.forEach(result => {
      const resultDiv = `
        <div class="exam">
          <div class="title">
            <h3>ID: ${result.exam.id}</h3>
            <h3>${result.exam.title}</h3>
            <p>${result.exam.course_title}</p>
          </div>
          <div class="score">
            <div class="row">
              <p class="exam_score">exam score</p>
              <p>${result.exam.exam_score}</p>
            </div>
            <div class="row">
              <p class="std_score">student score</p>
              <p>${result.score}</p>
            </div>
          </div>
          <div class="date">
            <p class="start">start : ${new Date(result.exam.start_date).toLocaleString()}</p>
            <p class="end">end : ${new Date(result.exam.end_date).toLocaleString()}</p>
          </div>
          <div class="ins">
            Ins / ${result.instructor.first_name} ${result.instructor.second_name}
          </div>
        </div>`;
      examsContainer.append(resultDiv);
    });
  };

  const getFinishedExams = (username, token) => {
    $.ajax({
      url: `http://127.0.0.1/api/exams/results/?student_name=${username}`,
      type: 'GET',
      headers: {
        Authorization: 'Bearer ' + token
      },
      success: populateFinishedExams,
      error: handleAjaxError
    });
  };

  // Call getFinishedExams after getUserProfile
  getUserProfile(userId, token).done((data) => {
    getFinishedExams(data.username, token);
  });
  getExams(token);
});
