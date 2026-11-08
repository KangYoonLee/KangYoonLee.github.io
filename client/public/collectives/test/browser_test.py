from playwright.sync_api import sync_playwright
from pathlib import Path
import time
URL='about:blank'
import re
BASE=Path('/mnt/data/CollectiveScope-v3')
def load_site(page):
    raw=(BASE/'index.html').read_text()
    raw=re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>', '', raw)
    raw=re.sub(r'<link[^>]*rel="stylesheet"[^>]*>', '', raw)
    page.set_content(raw)
    page.add_style_tag(content=(BASE/'styles.css').read_text())
    page.evaluate('history.replaceState = function() {}')
    page.add_script_tag(content=(BASE/'core.js').read_text())
    page.add_script_tag(content=(BASE/'app.js').read_text())
OUT=Path('/mnt/data/CollectiveScope-v3')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1512,'height':1100},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    load_site(page)
    page.screenshot(path=str(OUT/'desktop-initial.png'),full_page=True)
    print('title',page.title(),'gpuCards',page.locator('.gpu-card').count(),'lanes',page.locator('.flow-token').count())
    assert page.locator('.gpu-card').count()==4
    assert page.locator('.flow-token').count()==4
    a=page.locator('.flow-token').first.get_attribute('style')
    page.locator('#playBtn').click()
    page.wait_for_timeout(650)
    b=page.locator('.flow-token').first.get_attribute('style')
    assert a!=b,(a,b)
    page.screenshot(path=str(OUT/'desktop-playing.png'),full_page=True)
    print('in motion?',a!=b,'token',page.locator('.flow-token').first.inner_text())
    page.locator('#playBtn').click()
    c=page.locator('.flow-token').first.get_attribute('style')
    page.wait_for_timeout(300)
    d=page.locator('.flow-token').first.get_attribute('style')
    assert c==d,('pause failed',c,d)
    page.locator('#nextBtn').click()
    print('next step',page.locator('#stageTitle').inner_text())
    page.locator('#finishBtn').click()
    assert 'Complete' in page.locator('#stageTitle').inner_text()
    cards=page.locator('.gpu-card')
    for r in range(4):
        v=[int(c.inner_text()) for c in cards.nth(r).locator('.values-grid').last.locator('strong').all()]
        assert v==[s*4+r+1 for s in range(4)],(r,v)
    print('alltoall final gpu0',cards.first.locator('.values-grid').last.inner_text())
    page.locator('#opSelect').select_option('allreduce')
    page.locator('#algSelect').select_option('ring')
    page.locator('#finishBtn').click()
    for card in page.locator('.gpu-card').all():
        assert [int(c.inner_text()) for c in card.locator('.value-chip strong').all()]==[10]*4
    print('ring allreduce final 10*4 verified')
    page.locator('#langToggle').click()
    assert '모든 GPU' in page.locator('#pageTitle').inner_text()
    page.locator('[data-gpu="8"]').click()
    assert page.locator('.gpu-card').count()==8
    page.locator('#opSelect').select_option('alltoall')
    page.locator('#algSelect').select_option('pairwise')
    page.locator('#restartBtn').click()
    page.screenshot(path=str(OUT/'desktop-korean-8gpu.png'),full_page=True)
    print('8gpu OK',page.locator('.flow-token').count(),'errors',errors)
    page.locator('#algSelect').select_option('direct')
    assert page.locator('.flow-token').count()==56, '56 simultaneous logical messages for 8-GPU direct AllToAll'
    page.locator('[data-placement="intra"]').click()
    assert page.locator('#networkCount').inner_text().startswith('0'),page.locator('#networkCount').inner_text()
    assert 'NVSwitch' in page.locator('#physicalSvg').text_content()
    page.locator('#opSelect').select_option('allreduce')
    page.locator('#algSelect').select_option('tree')
    page.locator('#finishBtn').click()
    assert all(int(x.inner_text())==36 for x in page.locator('.value-chip strong').all()), 'Tree AllReduce 8 GPUs should sum to 36'
    print('Direct AllToAll (56 concurrent) and Tree AllReduce (8 GPU) confirmed')
    assert not errors,errors
    mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    load_site(mobile)
    mobile.screenshot(path=str(OUT/'mobile-initial.png'),full_page=True)
    overflow=mobile.evaluate('document.documentElement.scrollWidth - innerWidth')
    print('mobile overflow px',overflow)
    assert overflow<=1,overflow
    assert mobile.locator('.gpu-card').count()==4
    mobile.locator('#playBtn').click()
    mobile.wait_for_timeout(700)
    mobile.screenshot(path=str(OUT/'mobile-playing.png'),full_page=True)
    browser.close()