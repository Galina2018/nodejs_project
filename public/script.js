const headerForm = document.getElementById('headerForm');
headerForm.addEventListener('submit', addHeaderChange);

async function addHeaderMenu({idx}) {
  let headerMenu = document.getElementById('headerMenu');
  headerMenu.innerHTML += `<li id=menu><input value='' name="headerMenu" />
  <button type="button" onclick="deleteHeaderMenu({arr:'<%= data[0].menu %>', idx:'<%=i %>'})"
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
  console.log('***in deleteHeaderMenu *****');
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

async function addHeaderChange(evt) {
  evt.preventDefault();
  await fetch('/addHeaderChange', {
    method: 'POST',
    body: new FormData(headerForm),
  });
}

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
  <button type="button" onclick="deleteHeaderMenu({arr:'<%= data[0].menu %>', idx:${idx}})"
  >Удалить</button></li>`;
  const btnAdd = document.querySelector('menu ~ button');
  if (lastInput.value) {
    btnAdd.disabled = false;
    btnAdd.className = '';
  }
}
