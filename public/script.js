const headerForm = document.getElementById('headerForm');
headerForm?.addEventListener('submit', saveHeaderChange);
const aboutForm = document.getElementById('aboutForm');
aboutForm?.addEventListener('submit', saveAboutChange);
const serviceForm = document.getElementById('serviceForm');
serviceForm?.addEventListener('submit', saveServiceChange);
const articleForm = document.getElementById('articleForm');
articleForm?.addEventListener('submit', saveArticlesChange);
const seoForm = document.getElementById('seoForm');
seoForm?.addEventListener('submit', saveSeoChange);

const loginForm = document.getElementById('loginForm');
loginForm?.addEventListener('submit', auth);

function toLoginPage() {
  location.href = '/login';
}

let arrMenuGlobal = [];
const headerMenu = document.getElementById('headerMenu');
if (headerMenu) {
  headerMenu.getElementsByTagName('input');
  Array.from(headerMenu)?.forEach((e, i) =>
    arrMenuGlobal.push({ name: e.value, index: i })
  );
}

async function addHeaderMenu() {
  let headerMenu = document.getElementById('headerMenu');
  headerMenu.innerHTML += `<li id=menu><input value='' name="headerMenu" />
  <button type="button" onclick="deleteHeaderMenu({arr:'<%= dataHeader[0].list %>', idx:'<%=i %>'})"
>Удалить</button></li>`;
  arrMenuGlobal.push({ name: '', index: arrMenuGlobal.length });
}

async function deleteHeaderMenu({ arr, idx }) {
  console.log('***in deleteHeaderMenu *****', arr, idx);
  let arrMenu = arr.split(',');
  let listMenu = document.getElementById('headerMenu');
  listMenu.addEventListener('click', listHandler, false);
  function listHandler(event) {
    let parentLI = event.target.closest('li');
    parentLI.remove();
    listMenu.removeEventListener('click', listHandler, false);
  }
  if (Number.isInteger(+idx)) {
    await fetch('/deleteHeaderMenu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ arrMenu, index: idx }),
    });
  }
}

function toAboutPage() {
  console.log('in toAboutPage');
  location.href = '/about';
}

async function saveHeaderChange(evt) {
  try {
    evt.preventDefault();
    const response = await fetch('/saveHeaderChange', {
      method: 'POST',
      body: new FormData(headerForm),
    });
    const res = await response.text();
    reloadPage();
    if (res != 'ok') alert(res);
  } catch (error) {
    console.error('Error: ', error);
  }
}
async function saveAboutChange(evt) {
  evt.preventDefault();
  await fetch('/saveAboutChange', {
    method: 'POST',
    body: new FormData(aboutForm),
  });
}
async function saveServiceChange(evt) {
  evt.preventDefault();
  const serviceNumber = evt.submitter.name.slice(-1);
  let data = Array.from(new FormData(serviceForm));
  let rgxp = new RegExp(serviceNumber);
  data = data.filter(([key, val]) => !!key.match(rgxp));
  const dataService = new FormData();
  data.forEach((e) => {
    dataService.append(e[0].slice(0, -1), e[1]);
  });
  await fetch(`/saveServiceChange/${serviceNumber}`, {
    method: 'POST',
    body: dataService,
  });
}
async function saveArticlesChange(evt) {
  evt.preventDefault();
  // console.log('in saveArticlesChange');
  const articleNumber = evt.submitter.name.slice(-1);
  let data = Array.from(new FormData(articleForm));
  let rgxp = new RegExp(articleNumber);
  data = data.filter(([key, val]) => !!key.match(rgxp));
  const dataArticles = new FormData();
  data.forEach((e) => {
    dataArticles.append(e[0].slice(0, -1), e[1]);
  });
  await fetch(`/saveArticlesChange/${articleNumber}`, {
    method: 'POST',
    body: dataArticles,
  });
}

async function saveSeoChange(evt) {
  evt.preventDefault();
  let data = Array.from(new FormData(seoForm));
  console.log('in saveSeoChange data', data);
  console.log('in saveSeoChange', new FormData(seoForm));
  const response = await fetch('/saveSeoChange', {
    method: 'POST',
    body: new FormData(seoForm),
  });
  const res = await response.text();
  console.log('res', res);
}

async function reloadPage() {
  // console.log('=in reloadPage');
  // const response = await fetch('/admin', {
  //   method: 'GET',
  // });
  // const res = await response.text();
  location.reload();
}

async function auth(evt) {
  try {
    evt.preventDefault();
    const response = await fetch('/login', {
      method: 'POST',
      body: new FormData(loginForm),
    });
    if (response.ok) {
      location.href = '/admin';
    } else {
      const res = await response.text();
      alert(res);
    }
  } catch (error) {
    console.error(error);
  }
}
