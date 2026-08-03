/**
 * Experiencia Interactiva de Cumpleaños para Kyhara
 * Desarrollado con Vanilla JS, HTML5 Canvas y CSS3
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // CONFIGURACIÓN Y ESTADO INICIAL
  // ==========================================================================
  
  // Fecha objetivo: 03 de Agosto de 2026, 00:00 hs (Zona Horaria Argentina UTC-3)
  const TARGET_DATE = new Date('2026-08-03T00:00:00-03:00').getTime();
  const WAIT_TIME_MS = 80 * 1000; // 1 min y 20 seg (80 segundos)
  
  // Parámetros URL para Pruebas:
  // ?preview=true -> Desbloqueo inmediato
  // ?preview=wait -> Simula la espera obligatoria de 1m 20s con canción completa
  const urlParams = new URLSearchParams(window.location.search);
  const IS_PREVIEW_DIRECT = urlParams.get('preview') === 'true';
  const IS_PREVIEW_WAIT = urlParams.get('preview') === 'wait';

  // Elementos del DOM
  const startOverlay = document.getElementById('start-overlay');
  const startBtn = document.getElementById('start-btn');
  
  const countdownSection = document.getElementById('countdown-section');
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  
  const audioIndicator = document.getElementById('audio-indicator');
  const audioTrackName = document.getElementById('audio-track-name');
  
  const unlockedSection = document.getElementById('unlocked-section');
  const typewriterTitle = document.getElementById('typewriter-title');
  const verseCard = document.getElementById('verse-card');
  const letterBtnContainer = document.getElementById('letter-btn-container');
  const openLetterBtn = document.getElementById('open-letter-btn');
  
  const letterModal = document.getElementById('letter-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const envelope = document.getElementById('envelope');

  // Elementos de Audio
  const audioEnganchado = document.getElementById('audio-enganchado');
  const audioSky = document.getElementById('audio-sky');

  // Banderas de Estado
  let isUnlocked = false;
  let transitionTriggered = false;
  let activeAudio = null;

  // ==========================================================================
  // MANEJO DE AUDIO
  // ==========================================================================

  function getRandomStartTime(audioElement) {
    if (audioElement.duration && !isNaN(audioElement.duration) && audioElement.duration > 30) {
      const minTime = audioElement.duration * 0.05;
      const maxTime = audioElement.duration * 0.75;
      return minTime + Math.random() * (maxTime - minTime);
    }
    return 15;
  }

  function playAudio(audioElement, trackLabel, isRandomStart = false) {
    if (activeAudio && activeAudio !== audioElement) {
      activeAudio.pause();
    }
    
    activeAudio = audioElement;
    audioElement.volume = 1;

    if (isRandomStart) {
      const randomPoint = getRandomStartTime(audioElement);
      audioElement.currentTime = randomPoint;
    }

    audioElement.play().catch(err => console.warn('Autoplay restringido por el navegador:', err));
    if (trackLabel) audioTrackName.textContent = trackLabel;
  }

  audioEnganchado.addEventListener('ended', () => {
    if (!transitionTriggered && !isUnlocked) {
      const nextRandomPoint = getRandomStartTime(audioEnganchado);
      audioEnganchado.currentTime = nextRandomPoint;
      audioEnganchado.play().catch(err => console.warn(err));
    }
  });

  function crossfadeAudio(fromAudio, toAudio, toStartTime = 0, newTrackLabel = '') {
    const fadeDuration = 1500;
    const steps = 30;
    const intervalTime = fadeDuration / steps;
    let step = 0;

    toAudio.currentTime = toStartTime;
    toAudio.volume = 0;
    toAudio.play().catch(err => console.warn('Error al iniciar audio:', err));

    const fadeInterval = setInterval(() => {
      step++;
      const progress = step / steps;

      fromAudio.volume = Math.max(0, 1 - progress);
      toAudio.volume = Math.min(1, progress);

      if (step >= steps) {
        clearInterval(fadeInterval);
        fromAudio.pause();
        fromAudio.volume = 1;
        activeAudio = toAudio;
        if (newTrackLabel) audioTrackName.textContent = newTrackLabel;
      }
    }, intervalTime);
  }

  // ==========================================================================
  // INICIALIZACIÓN DE LA EXPERIENCIA
  // ==========================================================================

  startBtn.addEventListener('click', () => {
    startOverlay.style.opacity = '0';
    startOverlay.style.visibility = 'hidden';
    audioIndicator.classList.remove('hidden');

    initCountdown();
  });

  // ==========================================================================
  // SISTEMA DE CUENTA REGRESIVA Y ESPERA DE 1:20 MIN
  // ==========================================================================

  function initCountdown() {
    // Si se activa el modo de prueba directa
    if (IS_PREVIEW_DIRECT) {
      triggerUnlockExperience();
      return;
    }

    // Si se activa el modo de prueba de espera (1:20 min)
    if (IS_PREVIEW_WAIT) {
      runWaitTimerMode();
      return;
    }

    const now = new Date().getTime();
    const distance = TARGET_DATE - now;

    // SI YA SON LAS 00:00 O FALTAN MENOS DE 1 MIN Y 20 SEG AL ENTRAR
    if (distance <= 0 || distance < WAIT_TIME_MS) {
      runWaitTimerMode();
      return;
    }

    // SI ENTRA ANTES DE LAS 00:00 (MÁS DE 1:20 MINUTOS RESTANTES)
    playAudio(audioEnganchado, 'Música ambiental', true);
    updateTimer();

    const timerInterval = setInterval(() => {
      const remainingSeconds = updateTimer();

      if (remainingSeconds <= 0 && !isUnlocked) {
        clearInterval(timerInterval);
        triggerUnlockExperience();
      }
    }, 1000);
  }

  // Función encargada de ejecutar la cuenta regresiva de 1m 20s
  function runWaitTimerMode() {
    let remainingWaitMs = WAIT_TIME_MS;

    // Iniciar A Sky Full of Stars desde el segundo 0
    playAudio(audioSky, 'A Sky Full of Stars - Coldplay');

    // Inicializar reloj visual en 01:20
    daysEl.textContent = '00';
    hoursEl.textContent = '00';
    minutesEl.textContent = '01';
    secondsEl.textContent = '20';

    const forcedInterval = setInterval(() => {
      remainingWaitMs -= 1000;

      if (remainingWaitMs <= 0) {
        clearInterval(forcedInterval);
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        triggerUnlockExperience();
      } else {
        const mins = Math.floor(remainingWaitMs / 60000);
        const secs = Math.floor((remainingWaitMs % 60000) / 1000);
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = String(mins).padStart(2, '0');
        secondsEl.textContent = String(secs).padStart(2, '0');
      }
    }, 1000);
  }

  function updateTimer() {
    const now = new Date().getTime();
    const distance = TARGET_DATE - now;

    if (distance <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return 0;
    }

    const totalSeconds = Math.floor(distance / 1000);

    // Transición de música cuando faltan exactamente 80 segundos (1m 20s)
    if (totalSeconds <= 80 && !transitionTriggered && !IS_PREVIEW_DIRECT && !IS_PREVIEW_WAIT) {
      transitionTriggered = true;
      const skyStartOffset = Math.max(0, 80 - totalSeconds);
      crossfadeAudio(audioEnganchado, audioSky, skyStartOffset, 'A Sky Full of Stars - Coldplay');
    }

    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');

    return totalSeconds;
  }

  // ==========================================================================
  // EXPERIENCIA DESBLOQUEADA
  // ==========================================================================

  function triggerUnlockExperience() {
    isUnlocked = true;

    if (IS_PREVIEW_DIRECT) {
      playAudio(audioSky, 'A Sky Full of Stars - Coldplay');
      audioSky.currentTime = 80;
    }

    countdownSection.style.opacity = '0';
    countdownSection.style.transform = 'translateY(-20px)';

    setTimeout(() => {
      countdownSection.classList.add('hidden');
      unlockedSection.classList.remove('hidden');
      unlockedSection.style.opacity = '1';

      startGoldenConfetti(8000);
      backgroundParticles.setGoldenStarsMode();
      runTypewriterSequence();
    }, 1000);
  }

  // ==========================================================================
  // EFECTO TÍTULO TIPO MÁQUINA DE ESCRIBIR
  // ==========================================================================

  function runTypewriterSequence() {
    const lines = [
      "Feliz cumpleaños...",
      "Kyhara ❤️",
      "Te amo mucho."
    ];

    let lineIndex = 0;
    
    function typeNextLine() {
      if (lineIndex >= lines.length) {
        setTimeout(() => {
          verseCard.classList.remove('hidden');
          letterBtnContainer.classList.remove('hidden');
        }, 800);
        return;
      }

      const currentText = lines[lineIndex];
      typewriterTitle.textContent = "";
      let charIndex = 0;

      const typeChar = setInterval(() => {
        typewriterTitle.textContent += currentText.charAt(charIndex);
        charIndex++;

        if (charIndex >= currentText.length) {
          clearInterval(typeChar);
          lineIndex++;
          setTimeout(typeNextLine, 1200);
        }
      }, 90);
    }

    typeNextLine();
  }

  // ==========================================================================
  // MODAL Y CARTA ANIMADA
  // ==========================================================================

  openLetterBtn.addEventListener('click', () => {
    letterModal.classList.remove('hidden');
    setTimeout(() => {
      envelope.classList.add('open');
    }, 400);
  });

  closeModalBtn.addEventListener('click', closeLetterModal);
  letterModal.addEventListener('click', (e) => {
    if (e.target === letterModal) closeLetterModal();
  });

  function closeLetterModal() {
    envelope.classList.remove('open');
    setTimeout(() => {
      letterModal.classList.add('hidden');
    }, 500);
  }

  // ==========================================================================
  // CANVAS 1: PARTÍCULAS / ESTRELLAS DE FONDO
  // ==========================================================================

  class BackgroundParticles {
    constructor() {
      this.canvas = document.getElementById('star-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.goldenMode = false;
      
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.init();
      this.animate();
    }

    resize() {
      this.width = this.canvas.width = window.innerWidth;
      this.height = this.canvas.height = window.innerHeight;
    }

    init() {
      this.particles = [];
      const count = Math.floor((this.width * this.height) / 12000);
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.5 + 0.2,
          speed: Math.random() * 0.3 + 0.1,
          twinkleSpeed: Math.random() * 0.02 + 0.005
        });
      }
    }

    setGoldenStarsMode() {
      this.goldenMode = true;
      this.particles.forEach(p => {
        p.size = Math.random() * 3 + 1;
        p.alpha = Math.random() * 0.8 + 0.3;
      });
    }

    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      this.particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < 0) p.y = this.height;

        p.alpha += Math.sin(Date.now() * p.twinkleSpeed) * 0.01;
        const clampedAlpha = Math.max(0.1, Math.min(0.8, p.alpha));

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        if (this.goldenMode) {
          this.ctx.fillStyle = `rgba(232, 200, 139, ${clampedAlpha})`;
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = '#E8C88B';
        } else {
          this.ctx.fillStyle = `rgba(138, 122, 107, ${clampedAlpha * 0.5})`;
          this.ctx.shadowBlur = 0;
        }
        
        this.ctx.fill();
      });

      requestAnimationFrame(() => this.animate());
    }
  }

  const backgroundParticles = new BackgroundParticles();

  // ==========================================================================
  // CANVAS 2: CONFETI DORADO ELEGANTE
  // ==========================================================================

  function startGoldenConfetti(durationMs) {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const confettiCount = 80;
    const confetti = [];
    const colors = ['#E8C88B', '#DFB873', '#FFF0D4', '#C5A059'];

    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 2 + 1.5,
        speedX: Math.random() * 1 - 0.5,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2,
        opacity: 1
      });
    }

    const startTime = Date.now();

    function renderConfetti() {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, width, height);

      let activeParticles = 0;

      confetti.forEach(p => {
        if (p.opacity <= 0) return;

        activeParticles++;
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.01) + p.speedX;
        p.rotation += p.rotationSpeed;

        if (elapsed > durationMs - 2000) {
          p.opacity -= 0.015;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        ctx.restore();
      });

      if (elapsed < durationMs && activeParticles > 0) {
        requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }

    renderConfetti();
  }

});