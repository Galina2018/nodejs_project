getPageMain();

async function getPageMain() {
  console.log('in getPageMain');
  const response = await fetch('/main', {
    method: 'GET',
  });
  const res = await response.json();
}
