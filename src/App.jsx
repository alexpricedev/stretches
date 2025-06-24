import React, { useState, useEffect } from 'react'

// Audio and vibration utility for completion feedback
const playCompletionChime = () => {
  // Try vibration first (works well with music playing)
  try {
    if (navigator.vibrate) {
      // Double pulse pattern: vibrate 200ms, pause 100ms, vibrate 200ms
      navigator.vibrate([200, 100, 200])
    }
  } catch (error) {
    console.log('Vibration not supported')
  }

  // Then play audio chime
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Create a pleasant bell-like sound using multiple frequencies
    const playTone = (frequency, startTime, duration) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(frequency, startTime)
      oscillator.type = 'sine'
      
      // Create a gentle fade in and out
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + duration)
    }
    
    // Play a harmonious chord (C major)
    const now = audioContext.currentTime
    playTone(523.25, now, 0.8) // C5
    playTone(659.25, now + 0.1, 0.8) // E5  
    playTone(783.99, now + 0.2, 0.8) // G5
    
  } catch (error) {
    console.log('Audio not supported or blocked')
  }
}

const stretches = [
  { name: "90-90", bilateral: true },
  { name: "Toes Pose", bilateral: false },
  { name: "Squat", bilateral: false },
  { name: "Half Split", bilateral: true },
  { name: "Wide Leg Forward Fold", bilateral: false },
  { name: "Thread the Needle", bilateral: true },
  { name: "Lunge", bilateral: true },
  { name: "Puppy Pose on Blocks", bilateral: false },
  { name: "Wrist stretch", bilateral: false },
  { name: "Wide leg forward fold", bilateral: false }
]

function App() {
  const [gameState, setGameState] = useState('setup') // setup, warmup, stretch, rest, complete
  const [routineLength, setRoutineLength] = useState(3)
  const [selectedStretches, setSelectedStretches] = useState([])
  const [currentStretchIndex, setCurrentStretchIndex] = useState(0)
  const [currentSide, setCurrentSide] = useState('left') // left, right, single
  const [timeLeft, setTimeLeft] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [stretchPhase, setStretchPhase] = useState('stretch') // stretch, rest
  const [routineStartTime, setRoutineStartTime] = useState(null)
  const [totalRoutineTime, setTotalRoutineTime] = useState(0)

  const selectRandomStretches = (count) => {
    const shuffled = [...stretches].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  const startRoutine = () => {
    const selected = selectRandomStretches(routineLength)
    setSelectedStretches(selected)
    setGameState('warmup')
    setTimeLeft(15)
    setCurrentStretchIndex(0)
    setRoutineStartTime(Date.now())
    setTotalRoutineTime(0)
  }

  const getCurrentStretch = () => {
    return selectedStretches[currentStretchIndex]
  }

  const getTotalSteps = () => {
    return selectedStretches.reduce((total, stretch) => {
      return total + (stretch.bilateral ? 2 : 1)
    }, 0)
  }

  const getCurrentStep = () => {
    let step = 0
    for (let i = 0; i < currentStretchIndex; i++) {
      step += selectedStretches[i].bilateral ? 2 : 1
    }
    if (getCurrentStretch()?.bilateral && currentSide === 'right') {
      step += 1
    }
    return step + 1
  }

  const getNextUp = () => {
    const currentStretch = getCurrentStretch()
    
    if (gameState === 'warmup') {
      if (currentStretch) {
        return {
          name: currentStretch.name,
          side: currentStretch.bilateral ? 'left' : null
        }
      }
      return { name: '', side: null }
    }
    
    if (gameState === 'rest') {
      const wasLeftSide = currentStretch?.bilateral && currentSide === 'left'
      if (wasLeftSide) {
        return {
          name: currentStretch.name,
          side: 'right'
        }
      } else {
        const nextStretch = selectedStretches[currentStretchIndex + 1]
        if (nextStretch) {
          return {
            name: nextStretch.name,
            side: nextStretch.bilateral ? 'left' : null
          }
        }
        return { name: 'Complete!', side: null }
      }
    }
    
    if (gameState === 'stretch') {
      if (currentStretch?.bilateral && currentSide === 'left') {
        return {
          name: currentStretch.name,
          side: 'right'
        }
      } else {
        const nextStretch = selectedStretches[currentStretchIndex + 1]
        if (nextStretch) {
          return {
            name: nextStretch.name,
            side: nextStretch.bilateral ? 'left' : null
          }
        }
        return { name: 'Complete!', side: null }
      }
    }
    
    return { name: '', side: null }
  }

  const nextPhase = () => {
    const currentStretch = getCurrentStretch()
    
    if (gameState === 'warmup') {
      setGameState('stretch')
      setStretchPhase('stretch')
      setCurrentSide(currentStretch.bilateral ? 'left' : 'single')
      setTimeLeft(120) // 2 minutes
    } else if (gameState === 'stretch') {
      // Play completion chime when finishing a stretch side
      playCompletionChime()
      
      if (currentStretch.bilateral && currentSide === 'left') {
        setGameState('rest')
        setStretchPhase('rest')
        setTimeLeft(15)
      } else {
        // Only complete if we're not on a left side of bilateral stretch
        if (currentStretchIndex < selectedStretches.length - 1) {
          setGameState('rest')
          setStretchPhase('rest')
          setTimeLeft(15)
        } else {
          // Double-check: never complete on left side of bilateral
          if (currentStretch.bilateral && currentSide === 'left') {
            setGameState('rest')
            setStretchPhase('rest')
            setTimeLeft(15)
          } else {
            setTotalRoutineTime(Math.floor((Date.now() - routineStartTime) / 1000))
            setGameState('complete')
          }
        }
      }
    } else if (gameState === 'rest') {
      const wasLeftSide = currentStretch.bilateral && currentSide === 'left'
      
      if (wasLeftSide) {
        setGameState('stretch')
        setStretchPhase('stretch')
        setCurrentSide('right')
        setTimeLeft(120)
      } else {
        setCurrentStretchIndex(prev => prev + 1)
        setGameState('stretch')
        setStretchPhase('stretch')
        const nextStretch = selectedStretches[currentStretchIndex + 1]
        setCurrentSide(nextStretch?.bilateral ? 'left' : 'single')
        setTimeLeft(120)
      }
    }
  }

  const skipCurrent = () => {
    const currentStretch = getCurrentStretch()
    
    // Play completion chime when manually skipping a stretch
    if (gameState === 'stretch') {
      playCompletionChime()
    }
    
    // For bilateral stretches on left side, always go to right side (never skip entirely)
    if (gameState === 'stretch' && currentStretch?.bilateral && currentSide === 'left') {
      setGameState('rest')
      setStretchPhase('rest')
      setTimeLeft(15)
      return
    }
    
    // For all other cases, proceed normally
    nextPhase()
  }

  const resetApp = () => {
    setGameState('setup')
    setCurrentStretchIndex(0)
    setCurrentSide('left')
    setTimeLeft(0)
    setIsPaused(false)
    setSelectedStretches([])
    setRoutineStartTime(null)
    setTotalRoutineTime(0)
  }

  useEffect(() => {
    let interval = null
    if (timeLeft > 0 && !isPaused && gameState !== 'setup' && gameState !== 'complete') {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && gameState !== 'setup' && gameState !== 'complete') {
      // Check if this will complete the routine before calling nextPhase
      const currentStretch = getCurrentStretch()
      const isLastStretch = currentStretchIndex === selectedStretches.length - 1
      const willComplete = gameState === 'stretch' && isLastStretch && 
        (!currentStretch?.bilateral || currentSide === 'right')
      
      if (willComplete) {
        setTotalRoutineTime(Math.floor((Date.now() - routineStartTime) / 1000))
      }
      
      nextPhase()
    }
    return () => clearInterval(interval)
  }, [timeLeft, isPaused, gameState])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTotalTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  const getCurrentTitle = () => {
    const stretch = getCurrentStretch()
    if (!stretch) return { name: '', side: null }
    
    if (gameState === 'warmup') return { name: 'Prepare', side: null }
    if (gameState === 'rest') return { name: 'Prepare', side: null }
    
    if (stretch.bilateral) {
      return { name: stretch.name, side: currentSide.toUpperCase() }
    }
    return { name: stretch.name, side: null }
  }

  if (gameState === 'setup') {
    return (
      <div className="app">
        <div className="setup-screen">
          <h1>Get Your Stretch On</h1>
          <h2>Choose your routine length</h2>
          <div className="routine-options">
            {[
              { count: 3, duration: '7-9 min' },
              { count: 5, duration: '12-15 min' },
              { count: 7, duration: '17-21 min' }
            ].map(option => (
              <button
                key={option.count}
                className={`routine-btn ${routineLength === option.count ? 'active' : ''}`}
                onClick={() => setRoutineLength(option.count)}
              >
                <div className="routine-count">{option.count} stretches</div>
                <div className="routine-duration">{option.duration}</div>
              </button>
            ))}
          </div>
          <button className="start-btn" onClick={startRoutine}>
            Start Routine
          </button>
          <div className="audio-reminder">
            🔔 Set your phone to loud mode to hear completion chimes
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'complete') {
    return (
      <div className="app">
        <div className="complete-screen">
          <div className="complete-icon">🎉</div>
          <h1>Great Job!</h1>
          <p>You've completed your {routineLength}-stretch routine!</p>
          <div className="complete-stats">
            <div className="stat">
              <span className="stat-number">{routineLength}</span>
              <span className="stat-label">Stretches</span>
            </div>
            <div className="stat">
              <span className="stat-number">{getTotalSteps()}</span>
              <span className="stat-label">Total Sides</span>
            </div>
            <div className="stat">
              <span className="stat-number">{formatTotalTime(totalRoutineTime)}</span>
              <span className="stat-label">Total Time</span>
            </div>
          </div>
          <button className="restart-btn" onClick={resetApp}>
            Start New Routine
          </button>
        </div>
      </div>
    )
  }

  const currentStretch = getCurrentStretch()
  
  const isLastExercise = () => {
    if (currentStretchIndex === selectedStretches.length - 1) {
      // If it's bilateral and we're on the right side, or if it's single stretch
      return !currentStretch?.bilateral || currentSide === 'right'
    }
    return false
  }

  return (
    <div className="app">
      <div className="stretch-screen">
        <button className="reset-x" onClick={resetApp}>
          ×
        </button>
        
        <div className="progress">
          <div className="progress-text">
            {gameState === 'warmup' ? 'Preparing' : `${getCurrentStep()} of ${getTotalSteps()}`}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(getCurrentStep() / getTotalSteps()) * 100}%` }}
            />
          </div>
        </div>

        <div className={`timer ${gameState}`}>
          <div className={`time-display ${timeLeft <= 10 && gameState === 'stretch' ? 'flash' : ''}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="stretch-info">
          <h1 className="stretch-title">
            {getCurrentTitle().name}
            {getCurrentTitle().side && (
              <span className={`side-tag ${getCurrentTitle().side.toLowerCase()}`}>{getCurrentTitle().side} SIDE</span>
            )}
          </h1>
        </div>

        {(gameState === 'warmup' || gameState === 'rest') && (
          <div className="next-up">
            <div className="next-up-label">Next Up</div>
            <div className="next-up-name">
              {getNextUp().name}
            </div>
            {getNextUp().side && (
              <div className="next-up-side">
                <span className={`side-tag-outline ${getNextUp().side}`}>{getNextUp().side.toUpperCase()} SIDE</span>
              </div>
            )}
          </div>
        )}

        <div className="controls">
          <button 
            className="control-btn pause-btn"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button 
            className="control-btn skip-btn"
            onClick={skipCurrent}
          >
            {isLastExercise() ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App