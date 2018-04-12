const {ipcRenderer} = require('electron');

var timer = document.getElementById("timer-state-active");
var allowAdjustment = true;
var adjusting = false;
var initialMouseY = 0;
var seconds = 0;

timer.onmousedown = (e) => {
    adjusting = true;
    initialMouseY = e.pageY;
}

timer.onmouseup = (e) => {
    adjusting = false;
    initialMouseY = e.pageY;
}

// Makes setting timer a much smoother experience.
var settingBuffer = 0
var previousSettingGoingUp = true;
var threshold = 1500

timer.onmousemove = (e) => {
    if (adjusting) {
        if (!allowAdjustment)
            return;

        if (settingBuffer < 4) {
            settingBuffer += 1;
            return;
        }

        if (e.pageY < initialMouseY)
            seconds += 60;
        else
            seconds -= 60;

        initialMouseY = e.pageY

        timer.innerHTML = getTimeString();

        if (seconds == threshold)
            beginTimer();

        if (seconds < 0) {
            seconds = 0
            timer.innerHTML = getTimeString();
        }

        settingBuffer = 0
        timerAudio.settingTick.play();
    }
}

function getTimeString() {
    let sMod = "";

    if (seconds % 60 < 10)
        sMod = "0"

    return Math.trunc(seconds / 60) + ":" + sMod + seconds % 60;
}

var timerAudio = {}
timerAudio.tick = document.getElementById("timer-audio-tick")
timerAudio.tock = document.getElementById("timer-audio-tock")
timerAudio.settingTick = document.getElementById("timer-audio-settingTick")

timerAudio.timerComplete = document.getElementById("timer-audio-timerComplete")
timerAudio.timerComplete2 = document.getElementById("timer-audio-timerComplete2")
timerAudio.waitingForSetting = document.getElementById("timer-audio-waitingForSetting")
timerAudio.waitingForSetting2 = document.getElementById("timer-audio-waitingForSetting2")
timerAudio.pomodoroComplete = document.getElementById("timer-audio-pomodoroComplete")

timerAudio.timerSetChime = document.getElementById("timer-audio-timerSetChime");

var timerAudioPolarity = false;
var intervalObject;

var dictionary = {}
dictionary.firstInit = "Please set the time to <b>25 minutes</b> to begin your Pomodoro. You can set the timer in place by clicking and dragging on the clock numbers.";
dictionary.init25 = "Please set the time to <b>25 minutes</b> to initiate the next primary phase."
dictionary.during25 = "Be aware that a Pomodoro is <b>indivisible</b>, and if an interruption occurs you <b>must</b> either write it down for later, or discard the Pomodoro (by right-clicking the tray icon). This prevents work time from being replaced by break time erroneously."
dictionary.init5 = "Please set the time to <b>5 minutes</b> for your break phase."
dictionary.during5 = "Use this time to do something different. Move around? Grab tea? Watch a short video? Anything that is too engrossing may take your motivation from your work however."
dictionary.completed = "You've completed a Pomodoro, a 1 hour and 40 minutes (100 minutes) of work!<br>Well done. You may stop here, or set the <b>long break timer</b> to 30 minutes before creating a new Pomodoro after expiry."

var nextSteps = document.getElementById("nextSteps")
nextSteps.innerHTML = dictionary.firstInit

var currentPhase = 0
var phase = document.getElementById("phase")
phase.innerHTML = "Phase " + currentPhase + " of 7"

function incrementTimerPhase() {
    currentPhase += 1
    phase.innerHTML = "Phase " + currentPhase + " of 7"

    if (currentPhase % 2 == 0)
        nextSteps.innerHTML = dictionary.during5
    else
        nextSteps.innerHTML = dictionary.during25        

    if (currentPhase >= 8) {
        nextSteps.innerHTML = dictionary.completed
        phase.innerHTML = "Phase completion achieved."
    }
}

var alternatingSet1 = false

function requestTimerInput() {
    if (currentPhase % 2 == 0) {
        nextSteps.innerHTML = dictionary.init25
        threshold = 1500
    } else {
        nextSteps.innerHTML = dictionary.init5
        threshold = 300
    }

    if (currentPhase != 7) {
        if (alternatingSet1) {
            timerAudio.waitingForSetting.load()
            setTimeout(() => {timerAudio.waitingForSetting.play()}, 3000)
        } else {
            timerAudio.waitingForSetting2.load()
            setTimeout(() => {timerAudio.waitingForSetting2.play()}, 10000)
        }

        alternatingSet1 = !alternatingSet1
    }

    if (currentPhase == 7) {
        incrementTimerPhase()
        threshold = 1800
    }
}

var project = document.getElementById("project")
var title = document.getElementById("title")

var alternatingSet2 = false

function onTimerEnd() {
    seconds = 0;
    timer.innerHTML = getTimeString();

    clearInterval(intervalObject);
    intervalObject = null;

    timer.style.backgroundColor = "inherit";
    timer.style.outline = "none";

    remote.getCurrentWindow().show();
    remote.getCurrentWindow().focus();

    setTimeout(() => {
        remote.getCurrentWindow().show();
        remote.getCurrentWindow().focus()
    }, 200);

    if (currentPhase == 7)
        timerAudio.pomodoroComplete.play()
    else {
        if (alternatingSet2)
            timerAudio.timerComplete.play()
        else
            timerAudio.timerComplete2.play()

        alternatingSet2 = !alternatingSet2
    }

    if (currentPhase >= 8)
        return;

    project.removeAttribute("readonly")
    project.style = project.style + "-webkit-app-region: non-drag;"

    allowAdjustment = true
    requestTimerInput()
}

function beginTimer() {
    if (intervalObject != null)
        return;

    timerAudio.waitingForSetting.pause()
    timerAudio.waitingForSetting2.pause()

    incrementTimerPhase()
    allowAdjustment = false;

    timerAudio.timerSetChime.play();

    timer.style.backgroundColor = "#223040";
    timer.style.outline = "thick dotted #223040";

    if (project.innerText != "")
        title.innerText = project.innerText;

    project.setAttribute("readonly", "")
    project.style = project.style + "-webkit-app-region: drag;"

    intervalObject = setInterval(() => {
        seconds -= 1;
        timer.innerHTML = getTimeString();

        var shouldTick = remote.getGlobal("shouldTick")

        timerAudio.waitingForSetting.pause()
        timerAudio.waitingForSetting2.pause()

        if (shouldTick) {
            if (timerAudioPolarity)
                timerAudio.tick.play();
            else
                timerAudio.tock.play();
        }

        timerAudioPolarity = !timerAudioPolarity

        if (seconds < 1)
            onTimerEnd();
    }, 1000)
}

const remote = require('electron').remote; 

function init() {   
  document.getElementById("close-btn").addEventListener("click", function (e) {
    const window = remote.getCurrentWindow();
    window.minimize();
  }); 
}; 

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
    init(); 
  }
};

project.onkeyup = () => {
    project.innerText = project.innerText.replace(/[\r\n\v]+/g, '')
}