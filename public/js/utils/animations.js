/**
 * Animation utilities for enhanced UX
 */

/**
 * Animate card deal with staggered timing
 */
export function animateDeal(cards, container, delayMs = 100) {
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('card-dealing', 'fade-in');
      container.appendChild(card);

      // Remove animation class after completion
      setTimeout(() => {
        card.classList.remove('card-dealing', 'fade-in');
      }, 500);
    }, index * delayMs);
  });
}

/**
 * Animate snap effect with glow
 */
export function animateSnap(pileElement) {
  pileElement.classList.add('snap-animation');

  setTimeout(() => {
    pileElement.classList.remove('snap-animation');
  }, 400);
}

/**
 * Show victory confetti animation
 */
export function showVictoryConfetti() {
  const colors = ['#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0'];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';

    document.body.appendChild(confetti);

    // Remove after animation
    setTimeout(() => {
      confetti.remove();
    }, 3500);
  }
}

/**
 * Shake element to indicate error
 */
export function shakeElement(element) {
  element.classList.add('shake');

  setTimeout(() => {
    element.classList.remove('shake');
  }, 500);
}

/**
 * Bounce element for attention
 */
export function bounceElement(element) {
  element.classList.add('bounce');

  setTimeout(() => {
    element.classList.remove('bounce');
  }, 1000);
}

/**
 * Wiggle element
 */
export function wiggleElement(element) {
  element.classList.add('wiggle');

  setTimeout(() => {
    element.classList.remove('wiggle');
  }, 900); // 3 wiggles at 0.3s each
}

/**
 * Show loading spinner
 */
export function showLoadingSpinner(container) {
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.setAttribute('aria-label', 'Loading');
  container.appendChild(spinner);
  return spinner;
}

/**
 * Remove loading spinner
 */
export function hideLoadingSpinner(spinner) {
  if (spinner && spinner.parentNode) {
    spinner.remove();
  }
}

/**
 * Fade in element
 */
export function fadeIn(element, durationMs = 300) {
  element.style.opacity = '0';
  element.style.display = 'block';

  let start = null;
  const animate = (timestamp) => {
    if (!start) start = timestamp;
    const progress = (timestamp - start) / durationMs;

    element.style.opacity = Math.min(progress, 1);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

/**
 * Fade out element
 */
export function fadeOut(element, durationMs = 300) {
  let start = null;
  const initialOpacity = parseFloat(window.getComputedStyle(element).opacity) || 1;

  const animate = (timestamp) => {
    if (!start) start = timestamp;
    const progress = (timestamp - start) / durationMs;

    element.style.opacity = initialOpacity * (1 - Math.min(progress, 1));

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.style.display = 'none';
    }
  };

  requestAnimationFrame(animate);
}

/**
 * Slide element down
 */
export function slideDown(element) {
  element.classList.add('slide-down');

  setTimeout(() => {
    element.classList.remove('slide-down');
  }, 300);
}

/**
 * Slide element up
 */
export function slideUp(element) {
  element.classList.add('slide-up');

  setTimeout(() => {
    element.classList.remove('slide-up');
  }, 400);
}

/**
 * Add success animation
 */
export function showSuccess(element) {
  element.classList.add('success');

  setTimeout(() => {
    element.classList.remove('success');
  }, 500);
}

/**
 * Pulse element
 */
export function pulseElement(element, count = 3) {
  let pulses = 0;

  const pulse = () => {
    element.classList.add('pulse');

    setTimeout(() => {
      element.classList.remove('pulse');
      pulses++;

      if (pulses < count) {
        setTimeout(pulse, 100);
      }
    }, 1500);
  };

  pulse();
}

/**
 * Show skeleton loading
 */
export function showSkeletonLoading(container, count = 3) {
  const skeletons = [];

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton';
    skeleton.style.height = '20px';
    skeleton.style.marginBottom = '10px';
    skeleton.style.borderRadius = '4px';
    container.appendChild(skeleton);
    skeletons.push(skeleton);
  }

  return skeletons;
}

/**
 * Remove skeleton loading
 */
export function hideSkeletonLoading(skeletons) {
  skeletons.forEach(skeleton => skeleton.remove());
}

/**
 * Animate number counter
 */
export function animateCounter(element, from, to, durationMs = 1000) {
  let start = null;

  const animate = (timestamp) => {
    if (!start) start = timestamp;
    const progress = (timestamp - start) / durationMs;

    const current = Math.floor(from + (to - from) * Math.min(progress, 1));
    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.textContent = to;
    }
  };

  requestAnimationFrame(animate);
}

/**
 * Add typing indicator
 */
export function showTypingIndicator(container) {
  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(indicator);
  return indicator;
}

/**
 * Remove typing indicator
 */
export function hideTypingIndicator(indicator) {
  if (indicator && indicator.parentNode) {
    indicator.remove();
  }
}

/**
 * Scroll element into view smoothly
 */
export function scrollIntoView(element, behavior = 'smooth') {
  element.scrollIntoView({ behavior, block: 'center' });
}

/**
 * Add ripple effect on click
 */
export function addRippleEffect(button) {
  button.addEventListener('click', (e) => {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.className = 'ripple';

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
}
