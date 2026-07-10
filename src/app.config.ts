export default {
  pages: [
    "pages/login/index",
    "pages/register/index",
    "pages/home/index",
    "pages/course-list/index",
    "pages/exam-center/index",
    "pages/course-player/index",
    "pages/exam/index",
    "pages/exam-result/index",
    "pages/certificate-detail/index",
    "pages/profile/index",
    "pages/developer-debug/index"
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#F8FAFC",
    navigationBarTitleText: "企训通",
    navigationBarTextStyle: "black",
    navigationStyle: "custom"
  },
  tabBar: {
    color: "#667085",
    selectedColor: "#4F8EF7",
    backgroundColor: "#FFFFFF",
    borderStyle: "white",
    list: [
      {
        pagePath: "pages/home/index",
        text: "首页",
        iconPath: "assets/tabbar/home.png",
        selectedIconPath: "assets/tabbar/home-active.png"
      },
      {
        pagePath: "pages/course-list/index",
        text: "学习",
        iconPath: "assets/tabbar/learn.png",
        selectedIconPath: "assets/tabbar/learn-active.png"
      },
      {
        pagePath: "pages/exam-center/index",
        text: "考试",
        iconPath: "assets/tabbar/exam.png",
        selectedIconPath: "assets/tabbar/exam-active.png"
      },
      {
        pagePath: "pages/profile/index",
        text: "我的",
        iconPath: "assets/tabbar/profile.png",
        selectedIconPath: "assets/tabbar/profile-active.png"
      }
    ]
  },
};
