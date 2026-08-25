import assert from 'node:assert/strict';
import {
  buildAppPath,
  parseAppLocation,
  resolveAppTab,
} from '../src/lib/appRoutes.ts';

assert.equal(resolveAppTab('mock-tests'), 'catalog');
assert.equal(resolveAppTab('study-resources'), 'formulas');
assert.equal(resolveAppTab('reports'), 'reports');
assert.equal(resolveAppTab(undefined), 'home');

assert.equal(buildAppPath('home'), '/home');
assert.equal(buildAppPath('policies'), '/help');
assert.equal(buildAppPath('policies', 'faq'), '/help/faq');
assert.equal(buildAppPath('mock-engine'), '/exam');
assert.equal(buildAppPath('mock-study'), '/study-paper');
assert.equal(resolveAppTab('study-paper'), 'mock-study');
assert.equal(resolveAppTab('study-mock'), 'mock-study');

assert.deepEqual(parseAppLocation('/'), { surface: 'landing' });
assert.deepEqual(parseAppLocation('/sign-up'), { surface: 'sign-up' });
assert.deepEqual(parseAppLocation('/signup'), { surface: 'sign-up' });
assert.equal(parseAppLocation('/sign-up/extra').surface, 'not-found');
assert.deepEqual(parseAppLocation('/home'), {
  surface: 'app',
  tab: 'home',
  helpSubTab: 'info',
});
assert.deepEqual(parseAppLocation('/catalog'), {
  surface: 'app',
  tab: 'catalog',
  helpSubTab: 'info',
});
assert.deepEqual(parseAppLocation('/mocks'), {
  surface: 'app',
  tab: 'catalog',
  helpSubTab: 'info',
});
assert.deepEqual(parseAppLocation('/help/faq'), {
  surface: 'app',
  tab: 'policies',
  helpSubTab: 'faq',
});
assert.deepEqual(parseAppLocation('/policies/terms'), {
  surface: 'app',
  tab: 'policies',
  helpSubTab: 'terms',
});
assert.deepEqual(parseAppLocation('/contact'), {
  surface: 'app',
  tab: 'policies',
  helpSubTab: 'contact',
});
assert.deepEqual(parseAppLocation('/payment'), {
  surface: 'app',
  tab: 'payment',
  helpSubTab: 'info',
});
assert.equal(buildAppPath('policies', 'contact'), '/contact');
assert.equal(buildAppPath('policies', 'info', { asContact: true }), '/contact');
{
  const helpContact = parseAppLocation('/help/contact');
  assert.equal(helpContact.surface, 'app');
  if (helpContact.surface === 'app') {
    assert.equal(helpContact.helpSubTab, 'contact');
  }
}
assert.equal(parseAppLocation('/nope').surface, 'not-found');
assert.equal(parseAppLocation('/catalog/extra').surface, 'not-found');
assert.equal(parseAppLocation('/contact/extra').surface, 'not-found');

console.log('appRoutes OK');
