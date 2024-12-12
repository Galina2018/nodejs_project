getPageMain();

async function getPageMain() {
  console.log('in getPageMain');
  const response = await fetch('/main', {
    method: 'GET',
  });
  const res = await response.json();
  console.log('res', res[0]);

  const logo = document.getElementById('logo');
  logo.src = `${res[0].logo}`;
  const div = document.createElement('div');

  // about;
}
