import { useState } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/layout/Shell';
import { useLocalCareerState } from '@/hooks/useLocalCareerState';
import { Landing } from '@/pages/Landing';
import { Analyze } from '@/pages/Analyze';
import { Dashboard } from '@/pages/Dashboard';
import { Jobs } from '@/pages/Jobs';
import { JobDetail } from '@/pages/JobDetail';
import { Reports } from '@/pages/Reports';
import NotFound from '@/pages/not-found';

function App() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const { local, persist, resumeText, setResumeText, addInteraction } = useLocalCareerState();

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Shell menuOpen={mobileMenu} setMenuOpen={setMobileMenu}>
        <Switch>
          <Route path="/" component={() => <Landing />} />
          <Route
            path="/analyze"
            component={() => (
              <Analyze local={local} persist={persist} setResumeText={setResumeText} />
            )}
          />
          <Route
            path="/dashboard"
            component={() => (
              <Dashboard
                local={local}
                resumeText={resumeText}
                persist={persist}
                addInteraction={addInteraction}
              />
            )}
          />
          <Route
            path="/jobs"
            component={() => <Jobs local={local} addInteraction={addInteraction} />}
          />
          <Route
            path="/jobs/:jobId"
            component={() => <JobDetail local={local} addInteraction={addInteraction} />}
          />
          <Route path="/reports" component={() => <Reports local={local} />} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </WouterRouter>
  );
}

export default App;