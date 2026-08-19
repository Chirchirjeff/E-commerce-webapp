export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">About</h3>
            <p className="text-sm text-gray-600">
              Shop from your favorite sellers with ease.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>
                <a href="#" className="hover:text-primary-600">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-600">
                  FAQs
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>
                <a href="#" className="hover:text-primary-600">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-600">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2024 E-commerce Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
