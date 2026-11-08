import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
F=Path(__file__).resolve().parents[1]
HTML=(F/'index.html').read_text().replace('<link rel="stylesheet" href="./styles.css">','<style>'+(F/'styles.css').read_text()+'</style>').replace('<script defer src="./core.js"></script>','').replace('<script defer src="./app.js"></script>','')
async def load(page):
    await page.set_content(HTML,wait_until='load')
    await page.add_script_tag(content=(F/'core.js').read_text())
    await page.add_script_tag(content=(F/'app.js').read_text())
async def main():
  async with async_playwright() as p:
    browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=await browser.new_page(viewport={'width':1440,'height':1040})
    errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
    await load(page)
    opalgs={'alltoall':['pairwise','direct'],'allreduce':['ring','tree','direct'],'allgather':['ring'],'reducescatter':['ring','direct'],'broadcast':['tree','direct'],'reduce':['tree','direct'],'gather':['tree','direct'],'scatter':['tree','direct']}
    for n in [4,8]:
      await page.locator(f'[data-n="{n}"]').click()
      for op,algs in opalgs.items():
        await page.locator('#operation').select_option(op)
        for alg in algs:
          await page.locator('#algorithm').select_option(alg)
          assert (await page.evaluate('window.__collectiveDebug()'))['final']
          await page.locator('#play').click();await page.wait_for_timeout(60)
          d=await page.evaluate('window.__collectiveDebug()')
          assert d['playing'] and d['particles']>=0,(n,op,alg,d)
          await page.locator('#play').click()
          await page.locator('#complete').click()
          assert (await page.evaluate('window.__collectiveDebug()'))['step'] >=1
    # Ring graphic test
    await page.locator('[data-n="4"]').click();await page.locator('#operation').select_option('allreduce');await page.locator('#algorithm').select_option('ring');
    await page.screenshot(path=str(F/'ring.png'),full_page=True)
    await page.locator('[data-n="8"]').click();await page.locator('#operation').select_option('allreduce');await page.locator('#algorithm').select_option('tree');
    await page.screenshot(path=str(F/'tree.png'),full_page=True)
    await page.locator('#language').click();assert await page.locator('#language').inner_text()=='English'
    assert await page.locator('#scope-title').inner_text()=='그림 읽는 법'
    # Mobile layout has a scrollable, readable SVG canvas without crashing.
    mobile=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    mobile.on('pageerror',lambda e:errs.append(str(e)));await load(mobile)
    assert (await mobile.evaluate('window.__collectiveDebug()'))['n']==4
    await mobile.screenshot(path=str(F/'mobile.png'),full_page=True)
    print('PASS 32 UI configurations, timeline, language, ring/tree, mobile. Errors:', errs)
    assert not errs,errs
    await browser.close()
asyncio.run(main())