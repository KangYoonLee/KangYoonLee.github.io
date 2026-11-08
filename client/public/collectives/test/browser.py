import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
F=Path(__file__).resolve().parents[1]
HTML=(F/'index.html').read_text().replace('<link rel="stylesheet" href="./styles.css">','<style>'+(F/'styles.css').read_text()+'</style>').replace('<script defer src="./core.js"></script>','').replace('<script defer src="./app.js"></script>','')
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':1040},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.set_content(HTML,wait_until='load');await page.add_script_tag(content=(F/'core.js').read_text());await page.add_script_tag(content=(F/'app.js').read_text());await page.wait_for_timeout(100)
  print('initial:',await page.evaluate('window.__collectiveDebug?.()'));print('errors:',errors)
  await page.screenshot(path=str(F/'initial.png'),full_page=True)
  await page.locator('#play').click();await page.wait_for_timeout(650);during=await page.evaluate('window.__collectiveDebug?.()');print('during:',during,'errors:',errors)
  await page.screenshot(path=str(F/'playing.png'),full_page=True)
  await page.wait_for_timeout(1700);print('after one:',await page.evaluate('window.__collectiveDebug?.()'))
  await page.locator('#play').click();paused=await page.evaluate('window.__collectiveDebug?.()');print('paused:',paused)
  await page.screenshot(path=str(F/'paused.png'),full_page=True)
  # 8 GPUs inter alltoall direct and view test
  await page.locator('[data-n="8"]').click();await page.locator('[data-placement="inter"]').click();await page.locator('[data-view="dcn"]').click();await page.locator('#algorithm').select_option('direct');
  print('8GPU before:',await page.evaluate('window.__collectiveDebug?.()'))
  await page.screenshot(path=str(F/'8gpu-dcn.png'),full_page=True)
  await page.locator('#play').click();await page.wait_for_timeout(500);print('8gpu during:',await page.evaluate('window.__collectiveDebug?.()'));await page.screenshot(path=str(F/'8gpu-playing.png'),full_page=True)
  await page.locator('#play').click()
  await page.locator('#language').click();print('korean:',await page.locator('#language').inner_text())
  # 4gpu allreduce ring result
  await page.locator('[data-n="4"]').click();await page.locator('#operation').select_option('allreduce');await page.locator('#algorithm').select_option('ring');await page.locator('#complete').click();print('allreduce final:',await page.evaluate('window.__collectiveDebug?.()'))
  print('errors:',errors)
  await browser.close()
  if errors: raise Exception(errors)
  assert during['visible']>0 and during['progress']>0
  assert paused['playing'] is False
asyncio.run(main())