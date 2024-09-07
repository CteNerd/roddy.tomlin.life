// src/components/WelcomeSection.tsx
import React from 'react';

const WelcomeSection = () => {
  return (
    <section style={styles.section}>
      <h2>Welcome</h2>
      <p>
        Welcome to my site where I bring together the many aspects of my life into one platform. 
        Here you'll find resources for being a father, workouts, and my background.
      </p>
    </section>
  );
};

const styles = {
  section: {
    padding: '20px',
    backgroundColor: '#e0f7fa',
    textAlign: 'center' as 'center',
  },
};

export default WelcomeSection;
