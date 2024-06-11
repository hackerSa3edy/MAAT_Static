$(document).ready(function () {
  const token = document.cookie.replace(/(?:(?:^|.*;\s*)jwtAccess\s*=\s*([^;]*).*$)|^.*$/, '$1');
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  function fetchCourses (instructorId) {
    $('#course-name').empty();
    $.ajax({
      url: `https://maat-system.s1cario.tech/api/levels/courses/?instructor=${instructorId}`,
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token
      },
      success: function (data) {
        // handle the data as needed
        // assuming '#course-name' is the id of the select dropdown
        data.results.forEach(function (course) {
          const option = $('<option>').val(course.id).text(course.title);
          $('#course-name').append(option);
        });
      },
      error: function (error) {
        console.error('Error fetching courses:', error);
      }
    });
  }

  let editMode = false;
  let currentExamId = null;

  function fetchExams (userId) {
    $('.exams').empty();
    $.ajax({
      url: `https://maat-system.s1cario.tech/api/exams/?instructor_id=${userId}`,
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token
      },
      success: function (data) {
        if (data.results.length === 0) {
          $('.exams').append('<div class="exam" class="empty-exams">No exams have been created yet.</div>');
        } else {
          if ($('.exams').hasClass('empty-exams')) {
            $('.exams').removeClass('empty-exams');
          }
          data.results.forEach(function (exam) {
            const examDiv = `
              <div class="exam" exam_id="${exam.id}">
                <div class="title">
                  <h3>${exam.title}</h3>
                  <p>${exam.course.title}</p>
                </div>
                <div class="score">
                  <p>Exam Score</p>
                  <p>${exam.exam_score}</p>
                </div>
                <div class="date">
                  <p class="start">start : ${new Date(exam.start_date).toLocaleString('en-US', { timeZone: 'Africa/Cairo' })}</p>
                  <p class="end">end : ${new Date(exam.end_date).toLocaleString('en-US', { timeZone: 'Africa/Cairo' })}</p>
                </div>
                <div class="ins">
                  Ins / ${exam.instructor.first_name} ${exam.instructor.second_name}
                </div>
                <button type="button" class="edit_exam" exam_id="${exam.id}">Edit</button>
                <button type="button" class="delete_exam" exam_id="${exam.id}">Delete</button>
              </div>`;
            $('.exams').append(examDiv);

            $('.edit_exam').on('click', function () {
              const examId = $(this).attr('exam_id');
              console.log(examId);
              currentExamId = examId;
              editMode = true;

              // Populate the form with the exam data
              fetch(`https://maat-system.s1cario.tech/api/exams/${examId}`, {
                headers: {
                  Authorization: 'Bearer ' + token // replace 'token' with your actual token
                }
              })
                .then(response => response.json())
                .then(data => {
                  const exam = data;
                  $('#exam-title').val(exam.title);
                  $('#course-name').val(exam.course.id);
                  const cairoOffset = 3; // Cairo is UTC+2

                  const startDate = new Date(exam.start_date);
                  const startLocalDate = new Date(startDate.getTime() + cairoOffset * 60 * 60 * 1000);
                  const startIsoDate = startLocalDate.toISOString().slice(0, 16);
                  $('#start-date').val(startIsoDate);

                  const endDate = new Date(exam.end_date);
                  const endtLocalDate = new Date(endDate.getTime() + cairoOffset * 60 * 60 * 1000);
                  const endtIsoDate = endtLocalDate.toISOString().slice(0, 16);
                  $('#end-date').val(endtIsoDate);

                  $('#exam-score').val(exam.exam_score);
                }).catch(error => console.error('Error:', error));
            });

            $('.delete_exam').on('click', function () {
              const examId = $(this).attr('exam_id');
              $.ajax({
                url: `https://maat-system.s1cario.tech/api/exams/${examId}/`,
                method: 'DELETE',
                headers: {
                  Authorization: 'Bearer ' + token
                },
                success: function () {
                  $(`.exam[exam_id="${examId}"]`).remove();
                },
                error: function (error) {
                  console.error('Error deleting exam:', error);
                }
              });
            });
          });
        }
      },
      error: function (error) {
        console.error('Error fetching exams:', error);
        $('.exams').append(`<div class="exam" class="error">Error: ${error.status} ${error.statusText}<br>Message: ${error.responseText}</div>`);
      }
    });
  }

  const userId = JSON.parse(jsonPayload).user_id;
  // const userId = 5;
  fetchExams(userId);
  fetchCourses(userId);

  // Get the current date in ISO format
  const today = new Date();
  const formattedToday = today.toISOString().slice(0, 16);

  // Select the date input element and set the minimum date
  $('#start-date').attr('min', formattedToday);
  $('#end-date').attr('min', formattedToday);

  $('#submit').click(function (e) {
    e.preventDefault();

    $('.mainPage').css('opacity', '0.5');
    $('.addQuestions').css('visibility', 'visible');
    // Get form data
    const title = $('#exam-title').val();
    const course = $('#course-name').val();
    let startDate = new Date($('#start-date').val());
    let endDate = new Date($('#end-date').val());
    const examScore = $('#exam-score').val();

    // Convert dates to Cairo timezone
    startDate = startDate.toISOString();
    endDate = endDate.toISOString();

    // Prepare data to send
    const data = {
      title: title,
      instructor: userId, // This should be replaced with the actual instructor id
      start_date: startDate,
      end_date: endDate,
      course: course,
      exam_score: examScore
    };

    if (editMode) {
      // Send PUT request to update existing exam
      $.ajax({
        url: `https://maat-system.s1cario.tech/api/exams/${currentExamId}/`,
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token
        },
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (response) {
          // Update the exam in the exams list
          const examDiv = $(`.exam[exam_id="${response.id}"]`);
          examDiv.find('.title h3').text(response.title);
          examDiv.find('.title p').text(response.course.title);
          examDiv.find('.score p').last().text(response.exam_score);
          examDiv.find('.date .start').text(`start : ${new Date(response.start_date).toLocaleString('en-US', { timeZone: 'Africa/Cairo' })}`);
          examDiv.find('.date .end').text(`end : ${new Date(response.end_date).toLocaleString('en-US', { timeZone: 'Africa/Cairo' })}`);
          examDiv.find('.ins').text(`Ins / ${response.instructor.first_name} ${response.instructor.second_name}`);
        },
        error: function (error) {
          console.error('Error updating exam:', error);
        }
      });
    } else {
      // Send POST request
      $.ajax({
        url: 'https://maat-system.s1cario.tech/api/exams/',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token
        },
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (response) {
          // Append the new exam to the exams list
          const examDiv = `
                    <div class="exam" exam_id="${response.id}">
                        <div class="title">
                            <h3>${response.title}</h3>
                            <p>${response.course.title}</p>
                        </div>
                        <div class="score">
                            <p>Exam Score</p>
                            <p>${response.exam_score}</p>
                        </div>
                        <div class="date">
                            <p class="start">start : ${new Date(response.start_date).toLocaleString()}</p>
                            <p class="end">end : ${new Date(response.end_date).toLocaleString()}</p>
                        </div>
                        <div class="ins">
                            Ins / ${response.instructor.first_name} ${response.instructor.second_name}
                        </div>
                      <button type="button" class="edit_exam" exam_id="${response.id}">Edit</button>
                      <button type="button" class="delete_exam" exam_id="${response.id}">Delete</button>
                    </div>`;
          $('.exams').append(examDiv);
          $('.delete_exam').on('click', function () {
            const examId = $(this).attr('exam_id');
            $.ajax({
              url: `https://maat-system.s1cario.tech/api/exams/${examId}/`,
              method: 'DELETE',
              headers: {
                Authorization: 'Bearer ' + token
              },
              success: function () {
                $(`.exam[exam_id="${examId}"]`).remove();
              },
              error: function (error) {
                console.error('Error deleting exam:', error);
              }
            });
          });
        },
        error: function (error) {
          console.error('Error creating exam:', error);
          $('.exams').append(`<div class="exam" class="error">Error: ${error.status} ${error.statusText}<br>Message: ${error.responseText}</div>`);
        }
      });
    }
  });

  let currentQuestionId = null;

  $('#next-question, #submit-exam').click(function (e) {
    console.log('click');
    e.preventDefault();

    // Get question data
    const questionText = $('#question').val();

    // Prepare data to send
    const questionData = {
      exam: currentExamId,
      text: questionText
    };

    $.ajax({
      url: 'https://maat-system.s1cario.tech/api/exams/questions/',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
      },
      data: JSON.stringify(questionData),
      contentType: 'application/json',
      success: function (response) {
        // Store the id of the created question
        currentQuestionId = response.id;

        // Get choice data and submit choices
        $('.choice-text').each(function (index, element) {
          const choiceText = $(element).val();
          const isCorrect = $(element).siblings('.is-correct').is(':checked');

          // Prepare data to send
          const choiceData = {
            question: currentQuestionId,
            text: choiceText,
            is_correct: isCorrect
          };

          // Send POST request to create choice
          $.ajax({
            url: 'https://maat-system.s1cario.tech/api/exams/choices/',
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + token
            },
            data: JSON.stringify(choiceData),
            contentType: 'application/json',
            success: function (response) {
              // Choice created successfully
            },
            error: function (error) {
              console.error('Error creating choice:', error);
            }
          });
        });

        // If the next question button was clicked, clear the form for the next question
        if ($(this).attr('id') === 'next-question') {
          $('#question-form')[0].reset();
        }
      },
      error: function (error) {
        console.error('Error creating question:', error);
      }
    });

    // If the submit exam button was clicked, close the question creation window
    if ($(this).attr('id') === 'submit-exam') {
      $('.questionForm i').parent().parent().css('visibility', 'hidden');
      $('.mainPage').css('opacity', '1');
      editMode = false;
      currentExamId = null;
    }
  });

  // Add click event listener to the close icon in the question form
  $('.questionForm i').click(function () {
    $('.questionForm i').parent().parent().css('visibility', 'hidden');
    $('.mainPage').css('opacity', '1');
  });
});
