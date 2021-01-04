import "./App.css";
import Footer from "./app/footer/footer";
import SideNav from "./app/side-nav/sideNav";
import Main from "./app/Main.js";
import Banner from "./images/banner-img.png";

function App() {
  return (
    <>
      <SideNav />
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
      <div className={"menu-button col-50"} onClick={openNav}>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}

/* Set the width of the side navigation to 250px */
function openNav() {
  console.log("opened");
  if (document.getElementById("mySidenav") && document.getElementById("main"))
    document.getElementById("mySidenav").style.width = "200px";
}

export default App;
