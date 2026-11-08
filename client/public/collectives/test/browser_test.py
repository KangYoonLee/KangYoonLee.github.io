from playwright.sync_api import sync_playwright
import json,time
url='about:blank'
from pathlib import Path
base=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1365,'height':920},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda err: errors.append(str(err)))
    page.set_content(Path(base,'index.html').read_text(),wait_until='load')
    page.add_style_tag(content=Path(base,'styles.css').read_text())
    page.add_script_tag(content=Path(base,'core.js').read_text())
    page.add_script_tag(content=Path(base,'app.js').read_text())
    page.wait_for_timeout(500)
    print('init',page.evaluate('window.__collectiveScopeDebug?.()'))
    page.screenshot(path='/mnt/data/CollectiveScope-v2/preview-before.png',full_page=True)
    page.locator('#playBtn').click()
    page.wait_for_timeout(700)
    a=page.evaluate('window.__collectiveScopeDebug?.()')
    page.wait_for_timeout(550)
    b=page.evaluate('window.__collectiveScopeDebug?.()')
    print('during A',a,'during B',b)
    assert b['playing'] and b['progress']>a['progress']>.02
    assert b['physicalMarkers'][-1]!=a['physicalMarkers'][-1], 'Focus marker failed to move'
    page.screenshot(path='/mnt/data/CollectiveScope-v2/preview-playing.png',full_page=True)
    page.locator('#playBtn').click()
    c=page.evaluate('window.__collectiveScopeDebug?.()')
    page.wait_for_timeout(400)
    d=page.evaluate('window.__collectiveScopeDebug?.()')
    assert not d['playing'] and d['progress']==c['progress']
    print('paused',d)
    page.locator('#playBtn').click()
    page.wait_for_timeout(3200)
    print('next',page.evaluate('window.__collectiveScopeDebug?.()'))
    assert page.evaluate('window.__collectiveScopeDebug?.().step')>=1
    page.locator('#nextBtn').click()
    assert page.evaluate('window.__collectiveScopeDebug?.().playing')==False
    page.locator('[data-view="logical"]').click()
    assert page.locator('#canvasGrid').get_attribute('class').endswith('logical-only')
    page.screenshot(path='/mnt/data/CollectiveScope-v2/preview-logical.png',full_page=True)
    page.locator('[data-view="both"]').click()
    page.locator('#op').select_option('allreduce')
    page.locator('#alg').select_option('tree')
    page.locator('#n').select_option('8')
    page.locator('#topology').select_option('quad')
    page.locator('#langBtn').click()
    assert page.locator('html').get_attribute('lang')=='ko'
    page.locator('#playBtn').click()
    page.wait_for_timeout(300)
    assert page.evaluate('window.__collectiveScopeDebug?.().progress')>.01
    page.screenshot(path='/mnt/data/CollectiveScope-v2/preview-ko-both.png',full_page=True)
    print('errors',errors)
    assert not errors
    # mobile and horizontal overflow
    mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    mobile.on('pageerror',lambda err: errors.append(str(err)))
    mobile.set_content(Path(base,'index.html').read_text(),wait_until='load')
    mobile.add_style_tag(content=Path(base,'styles.css').read_text())
    mobile.add_script_tag(content=Path(base,'core.js').read_text())
    mobile.add_script_tag(content=Path(base,'app.js').read_text())
    mobile.screenshot(path='/mnt/data/CollectiveScope-v2/preview-mobile.png',full_page=True)
    result=mobile.evaluate('({doc:document.documentElement.scrollWidth,width:innerWidth})')
    print('mobile',result)
    assert result['doc']<=result['width']+2, 'mobile horizontal overflow'
    mobile.locator('#playBtn').click()
    mobile.wait_for_timeout(600)
    assert mobile.evaluate('window.__collectiveScopeDebug?.().progress')>.04
    assert not errors
    browser.close()
print('PASS browser integration tests')