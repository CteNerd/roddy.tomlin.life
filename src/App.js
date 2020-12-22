import "./App.css";
import Footer from "./app/footer/footer";
import SideNav from "./app/side-nav/sideNav";
import Main from "./app/Main.js";
import RtInitials from "./images/RT initials cursive - transparent.png";

function App() {
  return (
    <>
      <SideNav />
      <div className="main" id="main">
        <MenuButton />
        <Main />
        <footer>
          <Footer />
        </footer>
      </div>
    </>
  );
}

function MenuButton() {
  return (
    <div className={"menu-button"} onClick={openNav}>
      <img className={"menu-img"} src={RtInitials} />
      <label>Menu</label>
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
