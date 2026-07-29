import { db } from "./firebase.js";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const GUEST_EMAIL = "guest@join.com";

function cloneValue(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return Array.isArray(value) ? value.map((item) => ({ ...item })) : value;
  }
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser"));
  } catch (error) {
    return null;
  }
}

function getUserId() {
  const currentUser = getCurrentUser();
  return currentUser && currentUser.uid ? currentUser.uid : null;
}

function isGuestUser(currentUser = getCurrentUser()) {
  return (
    !currentUser ||
    currentUser.email === GUEST_EMAIL ||
    currentUser.name === "Guest User"
  );
}

function getCollectionRef(collectionName) {
  const userId = getUserId();
  if (!userId) return null;
  return collection(db, "users", userId, collectionName);
}

function readCachedCollection(collectionName, fallbackItems = []) {
  try {
    const rawValue = localStorage.getItem(collectionName);
    if (!rawValue) {
      return cloneValue(fallbackItems);
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue)
      ? parsedValue
      : cloneValue(fallbackItems);
  } catch (error) {
    return cloneValue(fallbackItems);
  }
}

function cacheCollection(collectionName, items) {
  localStorage.setItem(collectionName, JSON.stringify(items));
}

async function loadUserCollection(collectionName, fallbackItems = []) {
  const currentUser = getCurrentUser();
  const collectionRef = getCollectionRef(collectionName);

  if (isGuestUser(currentUser) || !collectionRef) {
    const cachedItems = readCachedCollection(collectionName, fallbackItems);
    cacheCollection(collectionName, cachedItems);
    return cachedItems;
  }

  const snapshot = await getDocs(collectionRef);

  if (snapshot.empty) {
    const seedItems = cloneValue(fallbackItems);

    await Promise.all(
      seedItems.map((item) => setDoc(doc(collectionRef, item.id), item))
    );

    cacheCollection(collectionName, seedItems);
    return seedItems;
  }

  const items = snapshot.docs.map((snapshotDoc) => ({
    id: snapshotDoc.id,
    ...snapshotDoc.data(),
  }));

  cacheCollection(collectionName, items);
  return items;
}

async function saveUserCollectionItem(collectionName, item) {
  const currentUser = getCurrentUser();
  const collectionRef = getCollectionRef(collectionName);

  if (isGuestUser(currentUser) || !collectionRef) {
    const cachedItems = readCachedCollection(collectionName, []);
    const nextItems = cachedItems.filter((entry) => entry.id !== item.id);
    nextItems.push(cloneValue(item));
    cacheCollection(collectionName, nextItems);
    return item;
  }

  await setDoc(doc(collectionRef, item.id), item, { merge: true });

  const cachedItems = readCachedCollection(collectionName, []);
  const nextItems = cachedItems.filter((entry) => entry.id !== item.id);
  nextItems.push(cloneValue(item));
  cacheCollection(collectionName, nextItems);

  return item;
}

async function deleteUserCollectionItem(collectionName, itemId) {
  const currentUser = getCurrentUser();
  const collectionRef = getCollectionRef(collectionName);

  if (!isGuestUser(currentUser) && collectionRef) {
    await deleteDoc(doc(collectionRef, itemId));
  }

  const nextItems = readCachedCollection(collectionName, []).filter(
    (entry) => entry.id !== itemId
  );

  cacheCollection(collectionName, nextItems);
}

async function mergeCurrentUserProfile(fields) {
  const currentUser = getCurrentUser();
  const userId = getUserId();

  if (isGuestUser(currentUser) || !userId) {
    return;
  }

  await setDoc(doc(db, "users", userId), fields, { merge: true });

  const updatedUser = {
    ...currentUser,
    ...fields,
  };

  localStorage.setItem("currentUser", JSON.stringify(updatedUser));

  if (fields.name) {
    localStorage.setItem("userName", fields.name);
  }
}

window.firestoreData = {
  getCurrentUser,
  getUserId,
  isGuestUser,
  loadUserCollection,
  saveUserCollectionItem,
  deleteUserCollectionItem,
  mergeCurrentUserProfile,
  readCachedCollection,
  cacheCollection,
};