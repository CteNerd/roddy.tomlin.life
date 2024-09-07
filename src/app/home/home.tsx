import React from 'react';
import Header from '../../components/Header/Header';
import HeroSection from '../../components/Hero/Hero';
import WelcomeSection from './WelcomeSection';
import Footer from '../../components/Footer/Footer';
import FamilyPhoto from '../../assets/images/family-photo.png';
import './home.css';

interface HeaderProps {
  menus: {
    title: string;
    items: {
      title: string;
      link: string;
    }[];
  }[];
}

function Home() {
  const menus: HeaderProps['menus'] = [
    { title: 'Auto-Bio', items: [
      { title: 'Prologue', link: '/prologue' },
      { title: 'Childhood', link: '/childhood' },
      { title: 'College', link: '/college' },
      { title: 'NFL', link: '/nfl' },
      { title: 'The Big Day', link: '/the-big-day' },
      { title: 'IT', link: '/it' }
    ]},
    { title: 'Projects', items: [
      { title: 'R3 Counseling', link: '/r3-counseling' },
      { title: 'Sugar Society SC', link: '/sugar-society-sc' },
      { title: 'Got Da Juice', link: '/got-da-juice' }
    ]},
    { title: 'Hobbies', items: [
      { title: 'Vlog', link: '/vlog' },
      { title: 'Woodshop', link: '/woodshop' },
      { title: 'Workouts', link: '/workouts' },
      { title: 'Gardening', link: '/gardening' }
    ]},
    { title: 'Social', items: [
      { title: 'FB', link: '/fb' },
      { title: 'LI', link: '/li' },
      { title: 'X', link: '/x' },
      { title: 'IG', link: '/ig' }
    ]}
  ];

  return (
    <div className='home'>
      <Header menus={menus} />
      <HeroSection />
      <WelcomeSection />
      <div className='home-body-container'>
        <div className='intro-img-container'>
          <img alt='tomlin family' className='intro-img' src={FamilyPhoto} />
        </div>
        <div className='home-intro-body-container'>
          <p>
            Welcome to my, Roddy Tomlin, site where I bring together the many aspects of my life into one platform. Within this site you will find resources for being a father (both do's and don'ts), workouts, as well as my background. I am simply grateful and blessed to be where I am;
            but I'll rest when I'm dead.
          </p>
          <p>
            Throughout life I have been blessed to meet people that are in
            different places within this race we call life. Listening to the words
            of these people has opened my eyes to views I didn't think of prior to
            the occassion. Rather it be learning from a rookie or the vet on
            his/her way to be enshrined, I believe wisdom can come from anyone at
            anytime.
          </p>
          <p>
            If you would like to reach out to me about anything, feel free to
            contact me via call, text, or email using the contact information
            below. Also, take your own copy of my r&eacute;sum&eacute; which can
            also be found below.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;