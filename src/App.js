import "./App.css";
import Footer from "./app/footer/footer";
import SideNav from "./app/side-nav/sideNav";
import Main from "./app/Main.js";

function App() {
  return (
    <>
      <SideNav />
      <header>
        <span onClick={openNav}>
          <MenuButton />
        </span>
      </header>
      <div className="main" id="main">
        <Main />
        <Footer />
      </div>
    </>
  );
}

function MenuButton() {
  return (
    <>
      <div className="menu-stripe"></div>
      <div className="menu-stripe"></div>
      <div className="menu-stripe"></div>
    </>
  );
}

/* Set the width of the side navigation to 250px */
function openNav() {
  console.log("opened");
  if (document.getElementById("mySidenav") && document.getElementById("main"))
    document.getElementById("mySidenav").style.width = "200px";
}

export default App;
