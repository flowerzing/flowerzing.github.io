const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const scrollProgress = document.querySelector(".scroll-progress");
const depthField = document.querySelector(".depth-field");
const customCursor = document.querySelector(".custom-cursor");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Abrir menú" : "Cerrar menú");
    siteNav.classList.toggle("is-open", !isExpanded);
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menú");
      siteNav.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menú");
      siteNav.classList.remove("is-open");
      menuToggle.focus();
    }
  });
}

const year = document.querySelector("#year");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

if (scrollProgress) {
  let animationFrame = 0;

  const updateScrollProgress = () => {
    animationFrame = 0;
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    scrollProgress.style.transform = `scaleX(${progress})`;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateScrollProgress);
      }
    },
    { passive: true },
  );
  updateScrollProgress();
}

const heroScene = document.querySelector(".hero-scene");

if (heroScene instanceof HTMLCanvasElement) {
  const context = heroScene.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (context) {
    let width = 0;
    let height = 0;
    let frameId = 0;
    let pointerX = 0;
    let pointerY = 0;
    let startTime = performance.now();

    const drawScene = (now) => {
      const progress = reducedMotion.matches ? 0 : (now - startTime) * 0.00012;
      const centerX = width * 0.51 + pointerX * 14;
      const centerY = height * 0.49 + pointerY * 10;
      const radius = Math.min(width * 0.36, height * 0.37);
      const tilt = -0.24 + pointerY * 0.08;
      const focalLength = radius * 5;

      context.clearRect(0, 0, width, height);
      context.fillStyle = "#111111";
      context.fillRect(0, 0, width, height);

      const glow = context.createRadialGradient(
        centerX + radius * 0.7,
        centerY - radius * 0.2,
        0,
        centerX + radius * 0.7,
        centerY - radius * 0.2,
        radius * 2.5,
      );
      glow.addColorStop(0, "rgba(110, 110, 110, 0.2)");
      glow.addColorStop(1, "rgba(17, 17, 17, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      const sphereGradient = context.createRadialGradient(
        centerX - radius * 0.4,
        centerY - radius * 0.48,
        radius * 0.04,
        centerX + radius * 0.28,
        centerY + radius * 0.2,
        radius * 1.25,
      );
      sphereGradient.addColorStop(0, "#777777");
      sphereGradient.addColorStop(0.35, "#4a4a4a");
      sphereGradient.addColorStop(0.72, "#252525");
      sphereGradient.addColorStop(1, "#171717");
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fillStyle = sphereGradient;
      context.fill();

      const projectPoint = (latitude, longitude) => {
        const rotatedLongitude = longitude + progress;
        const latitudeRadius = Math.cos(latitude);
        const x = latitudeRadius * Math.sin(rotatedLongitude);
        const y = Math.sin(latitude);
        const z = latitudeRadius * Math.cos(rotatedLongitude);
        const tiltedY = y * Math.cos(tilt) - z * Math.sin(tilt);
        const tiltedZ = y * Math.sin(tilt) + z * Math.cos(tilt);
        const perspective = focalLength / (focalLength - tiltedZ * radius);

        return {
          x: centerX + x * radius * perspective,
          y: centerY + tiltedY * radius * perspective,
          z: tiltedZ,
        };
      };

      const drawCurve = (points) => {
        let currentDepth = null;
        let currentPathOpen = false;

        for (let index = 1; index < points.length; index += 1) {
          const previous = points[index - 1];
          const point = points[index];
          const depth = (previous.z + point.z) * 0.5;
          const visibleSide = depth > 0;

          if (currentDepth !== visibleSide) {
            if (currentPathOpen) {
              context.stroke();
            }
            context.beginPath();
            context.strokeStyle = visibleSide
              ? "rgba(225, 225, 225, 0.2)"
              : "rgba(225, 225, 225, 0.055)";
            context.lineWidth = visibleSide ? 0.8 : 0.55;
            context.moveTo(previous.x, previous.y);
            currentDepth = visibleSide;
            currentPathOpen = true;
          }
          context.lineTo(point.x, point.y);
        }

        if (currentPathOpen) {
          context.stroke();
        }
      };

      for (let latitude = -75; latitude <= 75; latitude += 15) {
        const points = [];
        for (let longitude = 0; longitude <= 360; longitude += 4) {
          points.push(projectPoint((latitude * Math.PI) / 180, (longitude * Math.PI) / 180));
        }
        drawCurve(points);
      }

      for (let longitude = 0; longitude < 360; longitude += 15) {
        const points = [];
        for (let latitude = -88; latitude <= 88; latitude += 3) {
          points.push(projectPoint((latitude * Math.PI) / 180, (longitude * Math.PI) / 180));
        }
        drawCurve(points);
      }

      context.beginPath();
      context.ellipse(
        centerX,
        centerY,
        radius * 1.32,
        radius * 0.42,
        -0.2 + pointerX * 0.04,
        Math.PI,
        Math.PI * 2,
      );
      context.strokeStyle = "rgba(205, 205, 205, 0.34)";
      context.lineWidth = 0.8;
      context.stroke();
      context.beginPath();
      context.ellipse(
        centerX,
        centerY,
        radius * 1.32,
        radius * 0.42,
        -0.2 + pointerX * 0.04,
        0,
        Math.PI,
      );
      context.strokeStyle = "rgba(205, 205, 205, 0.13)";
      context.lineWidth = 0.8;
      context.stroke();

      for (let index = 0; index < 38; index += 1) {
        const x = ((index * 127 + 41) % 997) / 997;
        const y = ((index * 263 + 97) % 991) / 991;
        context.beginPath();
        context.arc(x * width, y * height, index % 5 === 0 ? 1.2 : 0.65, 0, Math.PI * 2);
        context.fillStyle = `rgba(235, 235, 235, ${0.12 + (index % 4) * 0.07})`;
        context.fill();
      }
    };

    const animateScene = (now) => {
      frameId = 0;
      drawScene(now);
      if (!reducedMotion.matches && !document.hidden) {
        frameId = window.requestAnimationFrame(animateScene);
      }
    };

    const startScene = () => {
      startTime = performance.now();
      if (!frameId && !reducedMotion.matches && !document.hidden) {
        frameId = window.requestAnimationFrame(animateScene);
      } else {
        drawScene(performance.now());
      }
    };

    const stopScene = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
      drawScene(performance.now());
    };

    const resizeScene = () => {
      const bounds = heroScene.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      heroScene.width = Math.round(width * pixelRatio);
      heroScene.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawScene(performance.now());
    };

    heroScene.addEventListener(
      "pointermove",
      (event) => {
        const bounds = heroScene.getBoundingClientRect();
        pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      },
      { passive: true },
    );
    heroScene.addEventListener("pointerleave", () => {
      pointerX = 0;
      pointerY = 0;
    });
    window.addEventListener("resize", resizeScene, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopScene();
      } else {
        startScene();
      }
    });
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        stopScene();
      } else {
        startScene();
      }
    });

    resizeScene();
    startScene();
  }
}

if (depthField instanceof HTMLCanvasElement) {
  const context = depthField.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (context) {
    let width = 0;
    let height = 0;
    let frameId = 0;
    let pointerX = 0;
    let pointerY = 0;
    let startedAt = performance.now();

    const resizeField = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      depthField.width = Math.round(width * pixelRatio);
      depthField.height = Math.round(height * pixelRatio);
      depthField.style.width = `${width}px`;
      depthField.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawField(performance.now());
    };

    const drawField = (now) => {
      const elapsed = reducedMotion.matches ? 0 : (now - startedAt) * 0.00016;
      const focalLength = Math.min(width, height) * 0.82;
      const columns = Math.ceil(width / 48) + 10;
      const rows = Math.ceil(height / 42) + 10;
      const points = [];

      context.clearRect(0, 0, width, height);
      for (let row = 0; row < rows; row += 1) {
        const depth = row * 0.65 + 1;
        const perspective = focalLength / (depth + 7);
        const pointRow = [];

        for (let column = 0; column < columns; column += 1) {
          const worldX = (column - (columns - 1) / 2) * 0.75;
          const wave =
            Math.sin(worldX * 0.42 + elapsed + depth * 0.13) * 0.26 +
            Math.cos(depth * 0.31 - elapsed * 1.4) * 0.2;
          const tilt = ((depth + 1) / rows) * 0.5;

          pointRow.push({
            x: width / 2 + (worldX + pointerX * tilt * 0.75) * perspective,
            y:
              height * 0.5 +
              (depth * 0.43 - wave + pointerY * tilt * 0.45) * perspective,
            depth,
          });
        }

        points.push(pointRow);
      }

      for (let row = 0; row < points.length; row += 1) {
        const lineDepth = row / points.length;
        context.beginPath();
        context.strokeStyle = `rgba(17, 17, 17, ${0.08 + lineDepth * 0.18})`;
        context.lineWidth = 0.65;

        for (let column = 0; column < points[row].length; column += 1) {
          const point = points[row][column];
          if (column === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        }
        context.stroke();
      }

      for (let column = 0; column < columns; column += 1) {
        context.beginPath();
        context.strokeStyle = "rgba(17, 17, 17, 0.09)";
        context.lineWidth = 0.55;

        for (let row = 0; row < points.length; row += 1) {
          const point = points[row][column];
          if (row === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        }
        context.stroke();
      }

      for (let row = 1; row < points.length; row += 3) {
        for (let column = 1; column < columns; column += 4) {
          const point = points[row][column];
          context.fillStyle = `rgba(17, 17, 17, ${0.07 + (row / rows) * 0.13})`;
          context.beginPath();
          context.arc(point.x, point.y, 1.1, 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    const animateField = (now) => {
      frameId = 0;
      drawField(now);
      if (!reducedMotion.matches && !document.hidden) {
        frameId = window.requestAnimationFrame(animateField);
      }
    };

    const startField = () => {
      startedAt = performance.now();
      if (!frameId && !reducedMotion.matches && !document.hidden) {
        frameId = window.requestAnimationFrame(animateField);
      }
    };

    const stopField = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
      drawField(performance.now());
    };

    window.addEventListener("resize", resizeField, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopField();
      } else {
        startField();
      }
    });
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        stopField();
      } else {
        startField();
      }
    });
    window.addEventListener(
      "pointermove",
      (event) => {
        pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
        pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true },
    );

    resizeField();
    startField();
  }
}

if (customCursor && window.matchMedia("(pointer: fine)").matches) {
  let targetX = -100;
  let targetY = -100;
  let ringX = targetX;
  let ringY = targetY;
  let cursorFrame = 0;

  const moveCursor = () => {
    cursorFrame = 0;
    ringX += (targetX - ringX) * 0.2;
    ringY += (targetY - ringY) * 0.2;
    customCursor.style.left = `${targetX}px`;
    customCursor.style.top = `${targetY}px`;
    customCursor.style.setProperty("--ring-x", `${ringX - targetX}px`);
    customCursor.style.setProperty("--ring-y", `${ringY - targetY}px`);
    customCursor.classList.add("is-visible");

    if (Math.abs(targetX - ringX) > 0.5 || Math.abs(targetY - ringY) > 0.5) {
      cursorFrame = window.requestAnimationFrame(moveCursor);
    }
  };

  const cursorRing = customCursor.querySelector(".cursor-ring");
  if (cursorRing) {
    cursorRing.style.transform = "translate3d(var(--ring-x, 0), var(--ring-y, 0), 0) translate(-50%, -50%)";
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") {
        return;
      }
      targetX = event.clientX;
      targetY = event.clientY;
      if (!cursorFrame) {
        cursorFrame = window.requestAnimationFrame(moveCursor);
      }
    },
    { passive: true },
  );

  document.addEventListener("pointerover", (event) => {
    if (event.target instanceof Element && event.target.closest("a, button")) {
      customCursor.classList.add("is-hovering");
    }
  });
  document.addEventListener("pointerout", (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest("a, button") &&
      (!(event.relatedTarget instanceof Node) || !event.target.contains(event.relatedTarget))
    ) {
      customCursor.classList.remove("is-hovering");
    }
  });
  window.addEventListener("pointerdown", () => customCursor.classList.add("is-clicking"));
  window.addEventListener("pointerup", () => customCursor.classList.remove("is-clicking"));
  window.addEventListener("blur", () => customCursor.classList.remove("is-visible"));
}

const revealElements = document.querySelectorAll("[data-reveal]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (revealElements.length && "IntersectionObserver" in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  document.body.classList.add("has-reveal");
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}
