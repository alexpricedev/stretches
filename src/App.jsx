import React, { useState, useEffect } from 'react'

const stretches = [
  { name: "Pigeon", bilateral: true },
  { name: "Toes Pose", bilateral: false },
  { name: "Squat", bilateral: false },
  { name: "Half Split", bilateral: true },
  { name: "Wide Leg Forward Fold", bilateral: false },
  { name: "Thread the Needle", bilateral: true },
  { name: "Lunge", bilateral: true }
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
  }

  useEffect(() => {
    let interval = null
    if (timeLeft > 0 && !isPaused && gameState !== 'setup' && gameState !== 'complete') {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && gameState !== 'setup' && gameState !== 'complete') {
      nextPhase()
    }
    return () => clearInterval(interval)
  }, [timeLeft, isPaused, gameState])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
              <span className="stat-label">Total Steps</span>
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
          <div className="time-display">
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