const headerForm = document.getElementById('headerForm');
headerForm.addEventListener('submit', addHeaderChange);

function addHeaderMenu() {
  console.log('in addHeaderMenu');
  const headerMenu = document.getElementById('headerMenu');
  headerMenu.innerHTML += '<li><input value="" name="headerMenu"/></li>';
}

async function deleteHeaderMenu({ arr, idx }) {
  console.log('***in deleteHeaderMenu *****');
  let arrMenu = arr.split(',');
  arrMenu.splice(idx, 1);
  console.log(456, arrMenu);
  console.log(111, JSON.stringify({ index: idx }));

  const idItemMenu = `menu${idx}`;
  const liForDel = document.getElementById(idItemMenu);
  liForDel.remove();
  await fetch('/deleteHeaderMenu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ index: idx }),
  });
}

async function addHeaderChange(evt) {
  // console.log('in addHeaderChange');
  evt.preventDefault();
  // const dataHeaderForm = new FormData(headerForm);
  // console.log(dataHeaderForm);
  // console.log(dataHeaderForm.get('headerLogo'));
  // console.log(dataHeaderForm.get('headerLogo').name);
  await fetch('/addHeaderChange', {
    method: 'POST',
    body: new FormData(headerForm),
  });
}
