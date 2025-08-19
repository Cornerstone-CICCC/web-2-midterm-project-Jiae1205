// ====== 기본 상수 ======
const apiKey = "fa4b9bb4e0c9fd5050ceec75d7c812b5";
const imgBase = "https://image.tmdb.org/t/p/w500";

// ====== 다크/라이트 모드 ======
const modeToggle = document.getElementById('modeToggle');
const body = document.body;
body.classList.add('light-mode');
if (modeToggle) {
  // 모드 토글 이벤트 안
modeToggle.addEventListener('change', () => {
  body.classList.toggle('dark-mode', modeToggle.checked);
  body.classList.toggle('light-mode', !modeToggle.checked);

  const modalContent = document.querySelector(".modal-content");
  if (modalContent) {
    modalContent.style.backgroundColor = modeToggle.checked ? "#1BFF54" : "#FF84C4";
    modalContent.style.color = "#121212"; // 글씨색 항상 #121212
  }
});

}

// ====== 검색창 토글 ======
const navList = document.getElementById('navList');
const searchList = document.getElementById('searchList');
const searchImg = navList ? navList.querySelector('img[alt="search_icon"]') : null;
const searchIconLi = searchImg ? searchImg.parentElement : null;
const searchCloseBtn = document.getElementById('searchCloseBtn');
const searchInput = document.getElementById('searchInput');

if (searchIconLi && searchList && navList) {
  searchIconLi.addEventListener('click', () => {
    navList.style.display = 'none';
    searchList.style.display = 'flex';
    if (searchInput) searchInput.focus();
  });
}
if (searchCloseBtn && searchList && navList) {
  searchCloseBtn.addEventListener('click', () => {
    searchList.style.display = 'none';
    navList.style.display = 'flex';
    if (searchInput) searchInput.value = "";
  });
}

// ====== 반응형 체크 ======
function isMobile() {
  return window.innerWidth < 768;
}

// ====== 모달 생성 ======
function createModal() {
  if (document.getElementById("movieModal")) return; // 중복 방지
  const modal = document.createElement("div");
  modal.id = "movieModal";
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close">&times;</span>
      <div class="modal-body"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const closeBtn = modal.querySelector(".modal-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }
  modal.addEventListener("click", (e) => {
    if (e.target.id === "movieModal") {
      modal.style.display = "none";
    }
  });
}
createModal();

// ====== 영화 상세 정보 ======
function fetchMovieDetail(movieId) {
  if (!movieId) return;
  fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US`)
    .then(res => res.json())
    .then(data => {
      const modal = document.getElementById("movieModal");
      const modalBody = modal ? modal.querySelector(".modal-body") : null;
      if (!modal || !modalBody) return;

      modalBody.innerHTML = `
        <h2>${data.title ?? "No title"}</h2>
        <p><strong>Release:</strong> ${data.release_date ?? "-"}</p>
        <p><strong>Rating:</strong> ⭐ ${data.vote_average ? data.vote_average.toFixed(1) : "-"}</p>
        <p><strong>Overview:</strong> ${data.overview ?? "No overview"}</p>
        <img src="${data.poster_path ? imgBase + data.poster_path : './images/no-poster.png'}" alt="${data.title ?? 'poster'}" />
      `;
      modal.style.display = "block";
    })
    .catch(err => console.error("Movie Detail Error:", err));
}

// ====== 포스터 클릭 이벤트 바인딩 ======
function addPosterClickEvent(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.tagName === "IMG" && target.dataset.id) {
      fetchMovieDetail(target.dataset.id);
    }
  });
}

// ====== Top 10 (Trending) ======
const topList = document.querySelector(".top_list");
function renderTopList(movies) {
  if (!topList) return;
  topList.innerHTML = "";
  movies.forEach((movie, index) => {
    const li = document.createElement("li");
    if (isMobile()) {
      li.style.flex = "0 0 80%";
      li.style.margin = "0 auto";
    } else {
      li.style.minWidth = "calc(50% - 1rem)";
      li.style.margin = "0";
    }
    const posterUrl = movie.poster_path ? `${imgBase}${movie.poster_path}` : "./images/no-poster.png";
    li.innerHTML = `
      <img src="${posterUrl}" alt="${movie.title ?? 'poster'}" data-id="${movie.id}">
      <div class="movie_info">
        <p class="movie_title">${movie.title ?? "-"}</p>
        <p class="movie_rating">★ ${movie.vote_average ?? "-"}</p>
      </div>
      <span class="ranks">${index + 1}</span>
    `;
    topList.appendChild(li);
  });
}

function slideTo(index, items) {
  if (!topList || !items || !items.length) return;
  const itemWidth = items[0].offsetWidth;
  const perStep = isMobile() ? 1 : 2; // 데스크탑에서 두 장 기준
  const offset = -index * itemWidth * perStep;
  topList.style.transform = `translateX(${offset}px)`;
}

// 트렌딩 불러오기
fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    const results = Array.isArray(data.results) ? data.results.slice(0, 10) : [];
    renderTopList(results);

    let currentIndex = 0;
    let items = document.querySelectorAll(".top_list li");
    slideTo(currentIndex, items);

    // 자동 슬라이드
    setInterval(() => {
      items = document.querySelectorAll(".top_list li"); // 리사이즈 후 갱신 대비
      if (!items.length) return;
      currentIndex = (currentIndex + 1) % items.length;
      slideTo(currentIndex, items);
    }, 5000);

    // 리사이즈 시 레이아웃 재계산
    window.addEventListener('resize', () => {
      renderTopList(results);
      items = document.querySelectorAll(".top_list li");
      slideTo(currentIndex, items);
    });

    addPosterClickEvent(".top_list");
  })
  .catch(err => console.error("Top 10 Movies Error:", err));

// ====== Now Playing ======
fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`)
  .then(res => res.json())
  .then(data => {
    const nowList = document.querySelector(".Now_list");
    if (!nowList) return;
    nowList.innerHTML = "";
    (data.results || []).forEach(movie => {
      const posterUrl = movie.poster_path ? `${imgBase}${movie.poster_path}` : "./images/no-poster.png";
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${posterUrl}" alt="${movie.title ?? 'poster'}" data-id="${movie.id}">
        <p class="movie_title">${movie.title ?? "-"}</p>
      `;
      nowList.appendChild(li);
    });
    addPosterClickEvent(".Now_list");
  })
  .catch(err => console.error("Now Playing Error:", err));

// ====== Recommendations (Popular) ======
fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`)
  .then(res => res.json())
  .then(data => {
    const recommendList = document.querySelector(".Recommend_list");
    if (!recommendList) return;
    recommendList.innerHTML = "";
    (data.results || []).slice(0, 10).forEach(movie => {
      const posterUrl = movie.poster_path ? `${imgBase}${movie.poster_path}` : "./images/no-poster.png";
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${posterUrl}" alt="${movie.title ?? 'poster'}" data-id="${movie.id}">
        <p class="movie_title">${movie.title ?? "-"}</p>
      `;
      recommendList.appendChild(li);
    });
    addPosterClickEvent(".Recommend_list");
  })
  .catch(err => console.error("Recommendations Error:", err));

// ====== Upcoming ======
fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=en-US&page=1`)
  .then(res => res.json())
  .then(data => {
    const upcomeList = document.querySelector(".Upcome_list");
    if (!upcomeList) return;
    upcomeList.innerHTML = "";
    (data.results || []).forEach(movie => {
      const posterUrl = movie.poster_path ? `${imgBase}${movie.poster_path}` : "./images/no-poster.png";
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${posterUrl}" alt="${movie.title ?? 'poster'}" data-id="${movie.id}">
        <p class="movie_title">${movie.title ?? "-"}</p>
      `;
      upcomeList.appendChild(li);
    });
    addPosterClickEvent(".Upcome_list");
  })
  .catch(err => console.error("Upcoming Error:", err));

// ====== ABOUT 토글 (HTML은 안 건드림) ======
(function setupAboutToggle() {
  if (!navList) return;

  const aboutMenu = navList.querySelector('li:nth-child(3)'); // ABOUT
  const moviesMenu = navList.querySelector('li:nth-child(1)'); // MOVIES
  const aboutSection = document.querySelector('.About_section'); // 없을 수도 있음 (가드 처리)
  const topDiv = document.querySelector('.top');
  const normalSections = document.querySelectorAll('main section'); // Now/Recommend/Upcome 등

  function showHome() {
    if (topDiv) topDiv.style.display = 'block';
    normalSections.forEach(sec => { sec.style.display = 'block'; });
    if (aboutSection) aboutSection.style.display = 'none';
  }
  function showAbout() {
    if (!aboutSection) {
      console.warn('About_section 이 HTML에 없습니다. (JS는 정상 동작 중)');
      return;
    }
    if (topDiv) topDiv.style.display = 'none';
    normalSections.forEach(sec => { sec.style.display = 'none'; });
    aboutSection.style.display = 'block';
  }

  if (aboutMenu) aboutMenu.addEventListener('click', showAbout);
  if (moviesMenu) moviesMenu.addEventListener('click', showHome);
})();

// ====== 모달 팝업 CSS 적용 & 중앙 배치 ======
(function setupModalStyles() {
  const modal = document.getElementById("movieModal");
  if (!modal) return;

  Object.assign(modal.style, {
    display: "none",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 9999,
    overflowY: "auto",
  });

  const modalContent = modal.querySelector(".modal-content");
  if (modalContent) {
    Object.assign(modalContent.style, {
      maxWidth: "500px",
      width: "90%",
      maxHeight: "80vh",
      overflowY: "auto",
      padding: "1rem",
      borderRadius: "8px",
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
      backgroundColor: body.classList.contains('dark-mode') ? "#1BFF54" : "#FF84C4"
    });
  }

  const closeBtn = modal.querySelector(".modal-close");
  if (closeBtn) {
    Object.assign(closeBtn.style, {
      cursor: "pointer",
      position: "absolute",
      top: "0.5rem",
      right: "0.5rem",
      fontSize: "1.5rem"
    });
  }

  // 모달 클릭 시 바깥 영역 닫기
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });
})();
