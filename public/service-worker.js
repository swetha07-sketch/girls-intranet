/* eslint-disable no-restricted-globals */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "2 States' Corner 🌸", body: event.data?.text() || "Something new!" };
  }

  const title = data.title || "2 States' Corner 🌸";
  const options = {
    body: data.body || "",
    icon: data.icon || "https://emojicdn.elk.sh/🌸?style=apple",
    badge: "https://emojicdn.elk.sh/🌸?style=apple",
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
