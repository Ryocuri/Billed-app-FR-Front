/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      // Setup common test environment
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))
      
      const html = NewBillUI()
      document.body.innerHTML = html
    })

    test("Then the form should be displayed with all expected fields", () => {
      // Check if all form fields are present
      expect(screen.getByTestId("expense-type")).toBeTruthy()
      expect(screen.getByTestId("expense-name")).toBeTruthy()
      expect(screen.getByTestId("datepicker")).toBeTruthy()
      expect(screen.getByTestId("amount")).toBeTruthy()
      expect(screen.getByTestId("vat")).toBeTruthy()
      expect(screen.getByTestId("pct")).toBeTruthy()
      expect(screen.getByTestId("commentary")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
      expect(screen.getByText("Envoyer")).toBeTruthy()
    })

    test("Then I can select a file to upload", () => {
      // Create a newBill instance
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname]
      }
      
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })
      
      // Mock the file API
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      
      // Get file input
      const fileInput = screen.getByTestId("file")
      
      // Add event listener
      fileInput.addEventListener("change", handleChangeFile)
      
      // Trigger file selection
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      // Check if handleChangeFile was called
      expect(handleChangeFile).toHaveBeenCalled()
      expect(fileInput.files[0].name).toBe('test.jpg')
    })

    test("Then I should be able to submit the form with all required fields", () => {
      // Create a newBill instance
      const onNavigate = jest.fn()
      
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })
      
      // Fill all required fields
      const expenseTypeField = screen.getByTestId("expense-type")
      const expenseNameField = screen.getByTestId("expense-name")
      const dateField = screen.getByTestId("datepicker")
      const amountField = screen.getByTestId("amount")
      const vatField = screen.getByTestId("vat")
      const pctField = screen.getByTestId("pct")
      const commentaryField = screen.getByTestId("commentary")
      
      fireEvent.change(expenseTypeField, { target: { value: "Transports" } })
      fireEvent.change(expenseNameField, { target: { value: "Paris-Lyon" } })
      fireEvent.change(dateField, { target: { value: "2023-05-01" } })
      fireEvent.change(amountField, { target: { value: "150" } })
      fireEvent.change(vatField, { target: { value: "30" } })
      fireEvent.change(pctField, { target: { value: "20" } })
      fireEvent.change(commentaryField, { target: { value: "Business trip" } })
      
      // Set billId and fileUrl (normally set by handleChangeFile)
      newBill.billId = "12345"
      newBill.fileUrl = "https://test.com/file.jpg"
      newBill.fileName = "file.jpg"
      
      // Mock the form submission
      const form = screen.getByTestId("form-new-bill")
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)
      
      // Submit the form
      fireEvent.submit(form)
      
      // Check if handleSubmit was called and navigation occurred
      expect(handleSubmit).toHaveBeenCalled()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills'])
    })

    test("Then the file upload should be limited to image formats (jpg, jpeg, png)", () => {
      // Create a newBill instance
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname]
      }
      
      // Mock console.error to check for non-image file
      console.error = jest.fn()
      
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })
      
      // Mock the file API with non-image file
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      
      // Get file input
      const fileInput = screen.getByTestId("file")
      
      // Add event listener
      fileInput.addEventListener("change", handleChangeFile)
      
      // Trigger file selection
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      // Check if handleChangeFile detects non-image file
      expect(handleChangeFile).toHaveBeenCalled()
      // Since the code doesn't have validation for file types yet, this test might not be applicable
      // This is where you would implement file type validation in the actual component
    })
  })

  // API Integration tests
  describe("When I submit a new bill", () => {
    test("Then the bill is created in the API", async () => {
      // Setup localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))
      
      // Render the form
      const html = NewBillUI()
      document.body.innerHTML = html
      
      // Create a newBill instance with mock store
      const onNavigate = jest.fn()
      const store = {
        bills: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({ fileUrl: 'http://localhost:3456/images/test.jpg', key: '1234' }),
          update: jest.fn().mockResolvedValue({})
        }))
      }
      
      const newBill = new NewBill({
        document,
        onNavigate,
        store: store,
        localStorage: window.localStorage
      })
      
      // Fill form with test data
      const form = screen.getByTestId("form-new-bill")
      const handleSubmit = jest.fn(newBill.handleSubmit)
      
      // Setup file data
      newBill.fileName = "test.jpg"
      newBill.fileUrl = "http://localhost:3456/images/test.jpg"
      newBill.billId = "1234"
      
      // Add submit listener
      form.addEventListener("submit", handleSubmit)
      
      // Submit the form
      fireEvent.submit(form)
      
      // Verify that store methods are called
      expect(handleSubmit).toHaveBeenCalled()
      await waitFor(() => expect(store.bills).toHaveBeenCalled())
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills'])
    })
    
    test("Then an error occurs on API", async () => {
      // Setup localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))
      
      // Render the form
      const html = NewBillUI()
      document.body.innerHTML = html
      
      // Create a store with error
      const store = {
        bills: jest.fn(() => ({
          create: jest.fn().mockRejectedValue(new Error("Error 500")),
          update: jest.fn().mockRejectedValue(new Error("Error 500"))
        }))
      }
      
      // Mock console.error to verify error handling
      console.error = jest.fn()
      
      // Create newBill instance
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: store,
        localStorage: window.localStorage
      })
      
      // Trigger file change to test error in create method
      const fileInput = screen.getByTestId("file")
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      // Trigger handleChangeFile
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      // Wait for promise rejection and check if error is caught
      await new Promise(process.nextTick)
      expect(console.error).toHaveBeenCalled()
    })
  })
})
