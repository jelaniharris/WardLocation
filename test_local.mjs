import {handler} from './index.mjs';
( async () => {
  const response = await handler({body: JSON.stringify({address: "1300 Lakeside Avenue East" })});
  //const response = await handler({body: "address=14206%20Nell%20Ave"});
  //const response = await handler({address: "E. 137th & Aspinwall Avenue" });
  //const response = await handler({address: "14206 Nell Ave" });
  console.log(response);
})();
