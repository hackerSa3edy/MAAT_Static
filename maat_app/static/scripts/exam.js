$(document).ready(function () {
  const BASE_URL = 'https://maat-system.s1cario.tech/api/exams/';
  const params = new URLSearchParams(window.location.search);
  const examTitle = params.get('exam_title');
  const examId = params.get('exam_id');

  if (!(examTitle && examId)) {
    $('body').empty();
    $('body').append(`
      <div id="message" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px;
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: .25rem;
        text-align: center;
        font-size: 1.25rem;
        font-family: Arial, sans-serif;
      ">
        The exam_id or exam_title or both are missing
      </div>
    `);
    return;
  }

  const token = document.cookie.replace(/(?:(?:^|.*;\s*)jwtAccess\s*=\s*([^;]*).*$)|^.*$/, '$1');
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  const studentId = JSON.parse(jsonPayload).user_id;
  // const studentId = 6;

  $('.mainPage h3.exam-title').text(examTitle);
  // Add this function to calculate the difference between two dates
  function calculateTimeDifference (endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now; // difference in milliseconds
    const seconds = Math.floor(diff / 1000);
    return seconds > 0 ? seconds : 0;
  }

  function formatTime (seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = seconds % 60;
    return `${days} days, ${hours} hours, ${minutes} minutes, ${remainingSeconds} seconds`;
  }

  // Send a request to retrieve the exam
  $.ajax({
    url: `${BASE_URL}${examId}/`,
    type: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    },
    success: function (response) {
      let timeOfExam = calculateTimeDifference(response.end_date);
      $('.mainPage .exam-duration').text(formatTime(timeOfExam));

      // Start a timer that updates every second
      const timer = setInterval(function () {
        timeOfExam--;
        $('.mainPage .exam-duration').text(formatTime(timeOfExam));

        // Stop the timer when time runs out
        if (timeOfExam <= 0) {
          clearInterval(timer);
          // You can add code here to handle what happens when time runs out
          window.location.href = '/';
        }
      }, 1000);
    },
    error: function (jqXHR, textStatus, errorThrown) {
      $('.questions').html(`<div class="error">${jqXHR?.responseJSON?.detail || textStatus}</div>`);
      $('button').prop('disabled', true);
    }
  });

  function sendRequest (url, type, data, successCallback) {
    $.ajax({
      url: url,
      type: type,
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: successCallback,
      error: function (jqXHR, textStatus, errorThrown) {
        $('.questions').html(`<div class="error">${jqXHR?.responseJSON?.detail || textStatus}</div>`);
        $('button').prop('disabled', true);
      }
    });
  }

  sendRequest(`${BASE_URL}questions/?exam_id=${examId}&exam_title=${examTitle}`, 'GET', null, updateQuestionsAndButtons);

  function updateQuestionsAndButtons (response) {
    $('.questions').empty();
    $.each(response.results, function (i, question) {
      const questionDiv = $('<div>').addClass(`q1 question-id-${question.id}`).data('question-id', question.id);
      const titleDiv = $('<div>').addClass('title');
      const h4 = $('<h4>').text(question.text);
      titleDiv.append(h4);
      questionDiv.append(titleDiv);
      const answersDiv = $('<div>').addClass('answers');
      $.each(question.choices, function (j, choice) {
        const p = $('<p>').addClass(`choice-id-${choice.id}`).text(choice.text).data('choice-id', choice.id).data('question-id', question.id);
        answersDiv.append(p);
      });
      questionDiv.append(answersDiv);
      $('.questions').append(questionDiv);
    });

    if (response.next) {
      $('button:contains("Next")').prop('disabled', false).data('url', response.next);
    } else {
      $('button:contains("Next")').prop('disabled', true).removeData('url');
    }
    if (response.previous) {
      $('button:contains("Previous")').prop('disabled', false).data('url', response.previous);
    } else {
      $('button:contains("Previous")').prop('disabled', true).removeData('url');
    }

    sendRequest('https://maat-system.s1cario.tech/api/exams/answers/', 'GET', null, function (answersResponse) {
      $.each(answersResponse.results, function (i, answer) {
        const questionDiv = $('.q1').filter(function () {
          return $(this).data('question-id') === answer.question.id;
        });
        questionDiv.data('answer-id', answer.id);
        const choiceP = questionDiv.find('p').filter(function () {
          return $(this).data('choice-id') === answer.student_choice.id;
        });
        choiceP.addClass('element');
      });
    });

    $('div.answers p').on('click', function () {
      const choiceId = $(this).data('choice-id');
      const questionId = $(this).data('question-id');
      const questionDiv = $('.q1').filter(function () {
        return $(this).data('question-id') === questionId;
      });
      const answerId = questionDiv.data('answer-id');

      if (answerId) {
        console.log('clicked');
        sendRequest(`${BASE_URL}answers/${answerId}/`, 'PUT', { student_choice: choiceId }, function (response) {
          questionDiv.find('.element').removeClass('element');
          const choiceElement = $(`.choice-id-${choiceId}`);
          choiceElement.addClass('element');
        });
      } else {
        sendRequest(`${BASE_URL}answers/`, 'POST', {
          student: studentId,
          exam: examId,
          question: questionId,
          student_choice: choiceId
        }, function (response) {
          questionDiv.data('answer-id', response.id);
          questionDiv.find('.element').removeClass('element');
          const choiceElement = $(`.choice-id-${choiceId}`);
          choiceElement.addClass('element');
        });
      }
    });
  }

  let counter = 1;

  $('.prev-next').click(function () {
    $('.error').remove();
    const direction = $(this).data('direction');
    const url = $(this).data('url');
    if (url) {
      sendRequest(url, 'GET', null, function (response) {
        updateQuestionsAndButtons(response);
        if (direction === 'next') {
          counter++;
        } else if (direction === 'prev' && counter > 1) {
          counter--;
        }
        $('#counter').text(counter);
      });
    }
  });

  $('.finish-button').click(function () {
    window.location.href = '/';
  });

  $('.terminal-button').click(function () {
    window.open('https://maat-system.s1cario.tech/terminal', '_blank');
  });
});
