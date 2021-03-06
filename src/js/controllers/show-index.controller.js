angular
.module('qwertyApp')
.controller('ShowIndexCtrl', ShowIndexCtrl)
.directive('keypressEvents', KeyPressDirective);


function KeyPressDirective($document, $rootScope) {
  return {
    restrict: 'A',
    link: function () {
      $document.bind('keypress', function (e) {
        $rootScope.$broadcast('keypress', e, String.fromCharCode(e.which));
      });
    }
  };
}

ShowIndexCtrl.$inject = ['Level', '$stateParams', '$scope', '$rootScope', 'User', 'CurrentUserService', '$state'];


function ShowIndexCtrl(Level, $stateParams, $scope, $rootScope, User, CurrentUserService, $state) {

  let wasTimerStarted = false, isLevelCompleted = false;
  let timeLeft = 0, timerID, globalScore = 0, charactersEntered = 0;

  const vm = this;
  vm.level = Level.get($stateParams);


  $scope.$textInput = $('#textInput').focus();

  // Preventing TAB
  $(document).keydown(function(objEvent) {
    if (objEvent.keyCode === 9) {  //tab pressed
      objEvent.preventDefault(); // stops its action
    }
  });

  $(document).keydown(function(e) {
    if(e.which === 13) {
      e.preventDefault(); // stops its action
      if (isLevelCompleted) $state.go('levelsIndex');
    }
  });

  $('#textInput').bind('cut copy paste',function(e) {
    e.preventDefault();
  });

  $('body').click(function() {
    // do something here
    $scope.$textInput = $('#textInput').focus();
  });

  // Getting our Level Data
  Level.get({ id: $stateParams.id}).$promise.then(data => {
    vm.level = data;

    // Wrapping original text into spans and setting it back to the DOM
    $scope.$textSource = $('#textSource').html(splitIntoSpans(vm.level.content));
    $scope.$textSource.find('span').eq(0).addClass('next');

    // $scope.$textInput.focus();
    //
    // $scope.$textInput.onblur = function () {
    //   setTimeout(function () {
    //     $scope.$textInput.focus();
    //   });
    // };
  });

  // function which runs each time user enters a character
  $scope.output = function() {

    if(!wasTimerStarted) {
      wasTimerStarted = true;
      timeLeft = vm.level.seconds;
      startTimer();
    }

    var spanClass;
    const inputText = $scope.textInput;
    const charIndex = inputText.length-1;
    const originalText = vm.level.content.substring(0,$scope.textInput.length);

    // Checking input for mistakes
    if (originalText[charIndex] === inputText[charIndex]) {

      // So far the input text is correct.
      spanClass = 'correct';

      // Adding score only for new correct characters
      if(inputText.length > charactersEntered) {

        charactersEntered++;
        globalScore = globalScore + (charactersEntered * timeLeft)/50;
        $scope.$scoreField = $('#scoreField').html(`Score: ${globalScore.toFixed(0)}`);

      }

    } else {
      spanClass = 'wrong';
    }

    const allSpans = $scope.$textSource.find('span');
    const currentSpan = allSpans.eq([charIndex]);

    currentSpan.removeClass();
    if (inputText.length !== 0) {

      currentSpan.addClass(spanClass);
      currentSpan.nextAll().removeClass();
      currentSpan.next().addClass('next');

    } else {
      allSpans.removeClass();
      allSpans.eq(0).addClass('next');
    }

    //Check for win condition:
    if(inputText === vm.level.content) {
      // User wins!

      userCompletedLevel();
      isLevelCompleted = true;
      $scope.$popUpWindow = $('#popUpWindow').html(`<h2>Your Score: ${globalScore.toFixed(0)}</h2><h2>Time Left: ${timeLeft}</h2> <span class="moveOn">Press Enter</span>`);
      $scope.$popUpWindow = $('#popUpWindow').removeClass().addClass('transformActive');

    }

  };

  function userCompletedLevel() {

    clearInterval(timerID);

    const play = {
      score: globalScore,
      wpm: 1,
      secondsLeft: 1,
      index: vm.level.index
    };

    Level
    .update({ id: vm.level._id }, play)
    .$promise
    .then(() => {
      // $state.go('levelsIndex');
    });



    CurrentUserService.getUser();

  }


  function startTimer() {

    timerID = setInterval(function() {

      // Find the distance between now an the count down date
      timeLeft = timeLeft - 1;
      $scope.$secondsField = $('#secondsField').html(`Seconds: ${timeLeft}`);

      // If the count down is finished, write some text
      if (timeLeft === -1) {

        isLevelCompleted = true;
        $scope.$secondsField = $('#secondsField').html(`Seconds: 0`);
        clearInterval(timerID);
        // **** alert('No more time left!');
        $scope.$popUpWindow = $('#popUpWindowFail').html(`<h1>Time Out!</h1> <span class="moveOnF">Press Enter</span>`);
        $scope.$popUpWindow = $('#popUpWindowFail').removeClass().addClass('transformActiveFail');
        // $state.go('levelsIndex');
      }
    }, 1000);

  }

  // $scope.key = 'none';

  // Key Listener 0
  // $rootScope.$on('keypress', function (evt, obj, key) {
  //   $scope.$apply(function () {
  //
  //     if(evt.keyCode === 8) {
  //       console.log('Delete');
  //     }
  //     $scope.key = key;
  //     console.log($scope.key);
  //   });
  // });

  //function addKeyPressHandler() {

  //   $(document).on('keypress', function(event) {
  //
  //     var input = String.fromCharCode(event.charCode),
  //     isRight = input === currentLesson[counter],
  //     spanClass = isRight ? "right" : "wrong",
  //     allSpans = chars.find("span"),
  //     currentSpan = allSpans.eq(counter);
  //
  //     counter++;
  //     once || (once = true) && output.text("");
  //     allSpans.removeClass("underline");
  //     currentSpan.addClass(spanClass);
  //     currentSpan.next().addClass(" underline");
  //     output.text(output.text() + input);
  //     event.preventDefault();
  //   });
  // }


}

// Function which wraps each char into a span
function splitIntoSpans(text) {
  return text.split('').map(function(n) {
    return '<span>' + n + '</span>';
  }).join('');
}
