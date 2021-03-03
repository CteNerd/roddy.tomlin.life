import "./App.css";
import Footer from "./app/footer/footer";
import SideNav from "./app/side-nav/sideNav";
import Main from "./app/Main.js";
import BannerImg from "./app/images/roddy_tomlin_life_banner.png"
import './app/fonts/RockSalt-Regular.ttf';
import './app/fonts/edosz.ttf';

function App() {
  return (
    <>
      <SideNav />
      <div className={"banner"}>
        <img className={"banner-img"} src={BannerImg} />
      </div>
        <header>
          <MenuButton />
        </header>
        <div className="main" id="main">
          <Main />
        </div>
        <footer>
          <Footer />
        </footer>
    </>
  );
}

function MenuButton() {
  return (
    <div>
      <div className={'banner'} onClick={openNav}>
        <div className={'menu-button col-4'}>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
}

/* Set the width of the side navigation to 250px */
function openNav() {
  if (document.getElementById("mySidenav") && document.getElementById("main"))
    document.getElementById("mySidenav").style.width = "200px";
}

export default App;
