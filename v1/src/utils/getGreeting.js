function getGreeting() {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();

  let greeting;
  let message;

  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Good Morning";
    message = "";
  } else if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good Afternoon";
    message = " ";
  } else {
    greeting = "Good Evening";
    message = " ";
  }

  return { greeting, message };
}

module.exports = { getGreeting }