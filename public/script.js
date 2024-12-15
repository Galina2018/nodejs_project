const headerForm = document.getElementById('headerForm');
headerForm.addEventListener('submit', saveHeaderChange);
const aboutForm = document.getElementById('aboutForm');
aboutForm.addEventListener('submit', saveAboutChange);
// const serviceForm1 = document.getElementById('abouserviceForm1tForm');
// serviceForm1.addEventListener('submit', saveService1Change);

async function addHeaderMenu({idx}) {
  let headerMenu = document.getElementById('headerMenu');
  headerMenu.innerHTML += `<li id=menu><input value='' name="headerMenu" />
  <button type="button" onclick="deleteHeaderMenu({arr:'<%= dataHeader[0].list %>', idx:'<%=i %>'})"
>Удалить</button></li>`;
  const last = document.querySelector('menu > li:last-child input');
  last.value = ''
  const btn = document.querySelector('menu ~ button');
  if (!last.value) {
    btn.disabled = true;
    btn.className = 'disabled';
  } 
}

async function deleteHeaderMenu({ arr, idx }) {
  console.log('***in deleteHeaderMenu *****', arr, idx);
  let arrMenu = arr.split(',');
  let idxItemMenu = `menu${idx}`;
  let liForDel = document.getElementById(idxItemMenu);
  liForDel.remove();
  await fetch('/deleteHeaderMenu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ arrMenu, index: idx }),
  });
}

async function saveHeaderChange(evt) {
  evt.preventDefault();
  await fetch('/saveHeaderChange', {
    method: 'POST',
    body: new FormData(headerForm),
  });
}
async function saveAboutChange(evt) {
  evt.preventDefault();
  await fetch('/saveAboutChange', {
    method: 'POST',
    body: new FormData(aboutForm),
  });
}

// async function saveService1Change(evt) {
//   evt.preventDefault();
//   console.log('in script saveService1Change')
//   await fetch('/saveService1Change', {
//     method: 'POST',
//     body: new FormData(serviceForm1),
//   });
// }

async function reloadHeaderMenu() {
  console.log('=in reloadHeaderMenu')
  await fetch('/admin', {
    method:"GET"
  })
  const lastLi = document.querySelector('menu > li:last-child');
  const lastInput = document.querySelector('menu > li:last-child input');
  const lastIindex = document.querySelectorAll('menu > li');
  const idx = lastIindex.length-1;
  const lastInputMemory = lastInput.value
  lastLi.remove();
  headerMenu.innerHTML += `<li id='menu${idx}'><input value=${lastInputMemory} name='headerMenu${idx}' />
  <button type="button" onclick="deleteHeaderMenu({arr:'<%= dataHeader[0].list %>', idx:${idx}})"
  >Удалить</button></li>`;
  const btnAdd = document.querySelector('menu ~ button');
  if (lastInput.value) {
    btnAdd.disabled = false;
    btnAdd.className = '';
  }
}
